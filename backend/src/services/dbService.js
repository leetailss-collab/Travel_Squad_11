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

// 5. Delete plan (moves it to the trash collection with deletedAt date)
const deletePlan = async (id) => {
  try {
    const planRef = db.collection('plans').doc(String(id));
    const planDoc = await planRef.get();
    if (planDoc.exists) {
      await db.collection('trash').doc(String(id)).set({
        ...planDoc.data(),
        deletedAt: new Date().toISOString()
      });
      await planRef.delete();
      return true;
    }
    
    const eventRef = db.collection('events').doc(String(id));
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      await db.collection('trash').doc(String(id)).set({
        ...eventDoc.data(),
        deletedAt: new Date().toISOString()
      });
      await eventRef.delete();
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error deleting plan/event ${id} in Firestore:`, err);
    throw err;
  }
};

// 5.2 Get all trash items and auto-clean expired ones (older than 15 days)
const getTrash = async () => {
  try {
    await cleanExpiredTrash();
    const snapshot = await db.collection('trash').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } catch (err) {
    console.error("Error getting trash from Firestore:", err);
    return [];
  }
};

// 5.3 Restore plan from trash
const restorePlan = async (id) => {
  try {
    const trashRef = db.collection('trash').doc(String(id));
    const trashDoc = await trashRef.get();
    if (!trashDoc.exists) return false;

    const data = trashDoc.data();
    const { deletedAt, ...planData } = data;

    const targetCollection = planData.isEvent ? 'events' : 'plans';
    await db.collection(targetCollection).doc(String(id)).set(planData);
    await trashRef.delete();
    return true;
  } catch (err) {
    console.error(`Error restoring plan ${id} from Firestore:`, err);
    throw err;
  }
};

// 5.4 Delete plan permanently from trash
const deletePlanPermanently = async (id) => {
  try {
    await db.collection('trash').doc(String(id)).delete();
    return true;
  } catch (err) {
    console.error(`Error permanently deleting plan ${id} from Firestore:`, err);
    throw err;
  }
};

// 5.5 Auto-clean expired trash (older than 15 days)
const cleanExpiredTrash = async () => {
  try {
    const snapshot = await db.collection('trash').get();
    const now = new Date();
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const batch = db.batch();
    let hasDeletions = false;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.deletedAt) {
        const deletedTime = new Date(data.deletedAt);
        if (now - deletedTime > FIFTEEN_DAYS_MS) {
          batch.delete(doc.ref);
          hasDeletions = true;
        }
      }
    });

    if (hasDeletions) {
      await batch.commit();
      console.log("Cleaned up expired trash items older than 15 days.");
    }
  } catch (err) {
    console.error("Error cleaning expired trash in Firestore:", err);
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
      address: p.address || '',
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

// 9. Get all anniversaries
const getAnniversaries = async () => {
  try {
    const snapshot = await db.collection('anniversaries').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } catch (err) {
    console.error("Error getting anniversaries from Firestore:", err);
    return [];
  }
};

// 10. Save or update an anniversary
const saveAnniversary = async (data) => {
  try {
    const id = data.id || `ann-${Date.now()}`;
    const item = {
      id,
      name: data.name,
      year: Number(data.year || 2026),
      month: Number(data.month),
      day: Number(data.day),
      isLunar: Boolean(data.isLunar),
      type: data.type || 'other'
    };
    await db.collection('anniversaries').doc(id).set(item);
    return item;
  } catch (err) {
    console.error("Error saving anniversary to Firestore:", err);
    throw err;
  }
};

// 11. Delete an anniversary
const deleteAnniversary = async (id) => {
  try {
    await db.collection('anniversaries').doc(String(id)).delete();
    return true;
  } catch (err) {
    console.error(`Error deleting anniversary ${id} from Firestore:`, err);
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
  addPlace,
  getAnniversaries,
  saveAnniversary,
  deleteAnniversary,
  getTrash,
  restorePlan,
  deletePlanPermanently
};
