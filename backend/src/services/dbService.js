const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (getApps().length > 0) {
    return;
  }
  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log("Initializing Firebase with local service account key...");
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    console.log("Local service account key not found. Using Application Default Credentials (GCP)...");
    initializeApp();
  }
};

initializeFirebase();
const db = getFirestore();

// 1. Authenticate user
const authenticateUser = async (username, pin) => {
  try {
    const userDoc = await db.collection('users').doc(username).get();
    if (!userDoc.exists) return null;
    const userData = userDoc.data();
    if (userData.pin === pin) {
      return { name: userData.name, role: userData.role };
    }
    return null;
  } catch (err) {
    console.error("Error authenticating user in Firestore:", err);
    return null;
  }
};

// 2. Fetch all plans (travels from 'plans' and events from 'events', merged & sorted by numeric id)
const getPlans = async () => {
  try {
    const plansSnapshot = await db.collection('plans').get();
    const eventsSnapshot = await db.collection('events').get();
    
    const items = [];
    
    plansSnapshot.forEach(doc => {
      items.push({ ...doc.data(), isEvent: false });
    });
    
    eventsSnapshot.forEach(doc => {
      items.push({ ...doc.data(), isEvent: true });
    });
    
    // Sort plans by id (numeric)
    items.sort((a, b) => Number(a.id) - Number(b.id));
    return items;
  } catch (err) {
    console.error("Error getting plans and events from Firestore:", err);
    return [];
  }
};

// 3. Fetch single plan (checks 'plans' first, then 'events')
const getPlanById = async (id) => {
  try {
    const planDoc = await db.collection('plans').doc(String(id)).get();
    if (planDoc.exists) {
      return { ...planDoc.data(), isEvent: false };
    }
    const eventDoc = await db.collection('events').doc(String(id)).get();
    if (eventDoc.exists) {
      return { ...eventDoc.data(), isEvent: true };
    }
    return null;
  } catch (err) {
    console.error(`Error getting plan/event ${id} from Firestore:`, err);
    return null;
  }
};

// 4. Create new plan (saves to 'events' if isEvent is true, otherwise 'plans')
const createPlan = async (planData) => {
  try {
    const allItems = await getPlans();
    const newId = allItems.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
    
    const newItem = {
      ...planData,
      id: newId,
      itinerary: planData.itinerary || [],
      expenses: planData.expenses || [],
      checklists: planData.checklists || []
    };
    
    const targetCollection = planData.isEvent ? 'events' : 'plans';
    await db.collection(targetCollection).doc(String(newId)).set(newItem);
    return newItem;
  } catch (err) {
    console.error("Error creating plan/event in Firestore:", err);
    throw err;
  }
};

// 5. Delete plan (checks both collections and deletes it from the one it belongs to)
const deletePlan = async (id) => {
  try {
    const planRef = db.collection('plans').doc(String(id));
    const planDoc = await planRef.get();
    if (planDoc.exists) {
      await planRef.delete();
      return true;
    }
    
    const eventRef = db.collection('events').doc(String(id));
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      await eventRef.delete();
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error deleting plan/event ${id} in Firestore:`, err);
    throw err;
  }
};

// 6. Sync full plan (updates the correct collection)
const syncPlan = async (id, planData) => {
  try {
    const targetCollection = planData.isEvent ? 'events' : 'plans';
    const ref = db.collection(targetCollection).doc(String(id));
    await ref.set(planData, { merge: true });
    const updated = await ref.get();
    return updated.data();
  } catch (err) {
    console.error(`Error syncing plan/event ${id} in Firestore:`, err);
    throw err;
  }
};

// 7. Add Comment to a place in the itinerary (checks 'plans' and 'events')
const addComment = async (planId, placeId, author, text) => {
  try {
    const planData = await getPlanById(planId);
    if (!planData) return null;
    
    let foundPlace = null;
    for (const dayItem of planData.itinerary) {
      const place = dayItem.places.find(p => p.id === placeId);
      if (place) {
        foundPlace = place;
        break;
      }
    }
    
    if (!foundPlace) return null;
    
    if (!foundPlace.comments) {
      foundPlace.comments = [];
    }
    
    const newComment = {
      id: Date.now(),
      author,
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    
    foundPlace.comments.push(newComment);
    
    const targetCollection = planData.isEvent ? 'events' : 'plans';
    await db.collection(targetCollection).doc(String(planId)).set(planData);
    return planData;
  } catch (err) {
    console.error(`Error adding comment to plan/event ${planId}, place ${placeId}:`, err);
    throw err;
  }
};

// 8. Add itinerary place (checks 'plans' and 'events')
const addPlace = async (planId, day, date, places) => {
  try {
    const planData = await getPlanById(planId);
    if (!planData) return null;
    
    const processedPlaces = (places || []).map(p => ({
      id: p.id || Date.now() + Math.random(),
      time: p.time,
      name: p.name,
      description: p.description || '',
      category: p.category || '관광',
      estimatedCost: Number(p.estimatedCost ?? p.cost) || 0,
      currency: p.currency || planData.currency || 'KRW',
      needsReservation: Boolean(p.needsReservation),
      tip: p.tip || '',
      payer: p.payer || '',
      comments: p.comments || []
    }));
    
    const dayIndex = planData.itinerary.findIndex(item => item.day === parseInt(day));
    if (dayIndex === -1) {
      planData.itinerary.push({ day: parseInt(day), date, places: processedPlaces });
    } else {
      planData.itinerary[dayIndex].places.push(...processedPlaces);
      planData.itinerary[dayIndex].places.sort((a, b) => a.time.localeCompare(b.time));
    }
    
    const targetCollection = planData.isEvent ? 'events' : 'plans';
    await db.collection(targetCollection).doc(String(planId)).set(planData);
    return planData;
  } catch (err) {
    console.error(`Error adding place to plan/event ${planId}:`, err);
    throw err;
  }
};

module.exports = {
  authenticateUser,
  getPlans,
  getPlanById,
  createPlan,
  deletePlan,
  syncPlan,
  addComment,
  addPlace
};
