const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: firebase-service-account.json not found!");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to convert time "HH:MM" to minutes
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Data files
const PLANS_FILE = path.join(__dirname, '../../data/plans.json');
const FAM_USERS = [
  { name: "이정우", pin: "570413", birth: "1957.04.13", engName: "LEE JUNG WOO", role: "user" },
  { name: "홍영숙", pin: "630124", birth: "1963.01.24", engName: "HONG YOUNGSOOK", role: "user" },
  { name: "이진수", pin: "850119", birth: "1985.01.19", engName: "LEE JINSOO", role: "user" },
  { name: "이아름", pin: "880803", birth: "1988.08.03", engName: "LEE AHREUM", role: "user" },
  { name: "이현수", pin: "870707", birth: "1987.07.07", engName: "LEE HYUNSOO", role: "admin" },
  { name: "양슬기", pin: "871214", birth: "1987.12.14", engName: "YANG SEULGI", role: "user" },
  { name: "이준성", pin: "110324", birth: "2011.03.24", engName: "LEE JUNSEONG", role: "user" },
  { name: "이은성", pin: "130813", birth: "2013.08.13", engName: "LEE EUNSEONG", role: "user" },
  { name: "이해성", pin: "200220", birth: "2020.02.20", engName: "LEE HAESEONG", role: "user" },
  { name: "이하성", pin: "210930", birth: "2021.09.30", engName: "LEE HASEONG", role: "user" },
  { name: "이주성", pin: "231110", birth: "2023.11.10", engName: "LEE JUSEONG", role: "user" }
];

const run = async () => {
  try {
    console.log("1. Reading plans.json...");
    if (!fs.existsSync(PLANS_FILE)) {
      console.error("plans.json not found!");
      process.exit(1);
    }
    
    const content = fs.readFileSync(PLANS_FILE, 'utf-8');
    const plans = JSON.parse(content);
    
    console.log("2. Calculating stay durations for all places...");
    for (const plan of plans) {
      if (!plan.itinerary) continue;
      
      for (const dayItem of plan.itinerary) {
        if (!dayItem.places || dayItem.places.length === 0) continue;
        
        // Sort places by time to ensure correct order
        dayItem.places.sort((a, b) => a.time.localeCompare(b.time));
        
        for (let i = 0; i < dayItem.places.length; i++) {
          const current = dayItem.places[i];
          
          if (i < dayItem.places.length - 1) {
            const next = dayItem.places[i + 1];
            const currentMins = timeToMinutes(current.time);
            const nextMins = timeToMinutes(next.time);
            
            // Stay duration is the gap between current and next start time
            let duration = nextMins - currentMins;
            if (duration < 0) duration = 60; // fallback if times are out of order
            current.duration = duration;
          } else {
            // Last place of the day gets default 60 minutes
            current.duration = 60;
          }
        }
      }
    }
    
    // Save updated plans back to plans.json
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf-8');
    console.log("- plans.json updated with calculated durations.");
    
    console.log("3. Migrating updated plans and users to Firestore...");
    
    // 3.1 Migrate users
    for (const user of FAM_USERS) {
      await db.collection('users').doc(user.name).set(user);
    }
    console.log("- Users migrated.");
    
    // 3.2 Migrate plans and events
    // Separate: travels go to 'plans', family events (isEvent: true) go to 'events'
    for (const item of plans) {
      const targetCollection = item.isEvent ? 'events' : 'plans';
      // Clean up previous documents in wrong collections if any
      if (item.isEvent) {
        await db.collection('plans').doc(String(item.id)).delete();
      } else {
        await db.collection('events').doc(String(item.id)).delete();
      }
      
      await db.collection(targetCollection).doc(String(item.id)).set(newItemData(item));
      console.log(`- Item ID '${item.id}' (${item.title}) migrated to '${targetCollection}' collection.`);
    }
    
    console.log("Migration and duration calculation completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
};

const newItemData = (item) => {
  return {
    id: item.id,
    title: item.title,
    startDate: item.startDate,
    endDate: item.endDate,
    members: item.members || [],
    manager: item.manager || '',
    currency: item.currency || 'KRW',
    ...(item.accommodation ? { accommodation: item.accommodation } : {}),
    ...(item.transportation ? { transportation: item.transportation } : {}),
    ...(item.isEvent ? { isEvent: true } : {}),
    ...(item.description ? { description: item.description } : {}),
    itinerary: item.itinerary || [],
    expenses: item.expenses || [],
    checklists: item.checklists || []
  };
};

run();
