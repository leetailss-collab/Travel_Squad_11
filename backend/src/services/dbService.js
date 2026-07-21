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
    // This will automatically pick up credentials on GCP VM or from GOOGLE_APPLICATION_CREDENTIALS env var
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

// 2. Fetch all plans (sorted by numeric id)
const getPlans = async () => {
  try {
    const snapshot = await db.collection('plans').get();
    const plans = [];
    snapshot.forEach(doc => {
      plans.push(doc.data());
    });
    // Sort plans by id (numeric)
    plans.sort((a, b) => Number(a.id) - Number(b.id));
    return plans;
  } catch (err) {
    console.error("Error getting plans from Firestore:", err);
    return [];
  }
};

// 3. Fetch single plan
const getPlanById = async (id) => {
  try {
    const doc = await db.collection('plans').doc(String(id)).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.error(`Error getting plan ${id} from Firestore:`, err);
    return null;
  }
};

// 4. Create new plan
const createPlan = async (planData) => {
  try {
    const plans = await getPlans();
    const newId = plans.reduce((maxId, plan) => Math.max(maxId, Number(plan.id) || 0), 0) + 1;
    
    const newPlan = {
      ...planData,
      id: newId,
      itinerary: planData.itinerary || [],
      expenses: planData.expenses || [],
      checklists: planData.checklists || []
    };
    
    await db.collection('plans').doc(String(newId)).set(newPlan);
    return newPlan;
  } catch (err) {
    console.error("Error creating plan in Firestore:", err);
    throw err;
  }
};

// 5. Delete plan
const deletePlan = async (id) => {
  try {
    const docRef = db.collection('plans').doc(String(id));
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  } catch (err) {
    console.error(`Error deleting plan ${id} in Firestore:`, err);
    throw err;
  }
};

// 6. Sync full plan
const syncPlan = async (id, planData) => {
  try {
    const planRef = db.collection('plans').doc(String(id));
    await planRef.set(planData, { merge: true });
    const updated = await planRef.get();
    return updated.data();
  } catch (err) {
    console.error(`Error syncing plan ${id} in Firestore:`, err);
    throw err;
  }
};

// 7. Add Comment to a place in the itinerary
const addComment = async (planId, placeId, author, text) => {
  try {
    const planRef = db.collection('plans').doc(String(planId));
    const doc = await planRef.get();
    if (!doc.exists) return null;
    
    const plan = doc.data();
    let foundPlace = null;
    for (const dayItem of plan.itinerary) {
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
    await planRef.set(plan);
    return plan;
  } catch (err) {
    console.error(`Error adding comment to plan ${planId}, place ${placeId}:`, err);
    throw err;
  }
};

// 8. Add itinerary place
const addPlace = async (planId, day, date, places) => {
  try {
    const planRef = db.collection('plans').doc(String(planId));
    const doc = await planRef.get();
    if (!doc.exists) return null;
    
    const plan = doc.data();
    const processedPlaces = (places || []).map(p => ({
      id: p.id || Date.now() + Math.random(),
      time: p.time,
      name: p.name,
      description: p.description || '',
      category: p.category || '관광',
      estimatedCost: Number(p.estimatedCost ?? p.cost) || 0,
      currency: p.currency || plan.currency || 'KRW',
      needsReservation: Boolean(p.needsReservation),
      tip: p.tip || '',
      payer: p.payer || '',
      comments: p.comments || []
    }));
    
    const dayIndex = plan.itinerary.findIndex(item => item.day === parseInt(day));
    if (dayIndex === -1) {
      plan.itinerary.push({ day: parseInt(day), date, places: processedPlaces });
    } else {
      plan.itinerary[dayIndex].places.push(...processedPlaces);
      plan.itinerary[dayIndex].places.sort((a, b) => a.time.localeCompare(b.time));
    }
    
    await planRef.set(plan);
    return plan;
  } catch (err) {
    console.error(`Error adding place to plan ${planId}:`, err);
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
