const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: firebase-service-account.json not found! Please place it in the backend folder.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 1. Data to migrate
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

const migrate = async () => {
  try {
    console.log("Starting migration to Firestore...");

    // 1. Migrate users
    console.log("Migrating users...");
    for (const user of FAM_USERS) {
      await db.collection('users').doc(user.name).set(user);
      console.log(`- User '${user.name}' migrated.`);
    }

    // 2. Migrate plans
    if (fs.existsSync(PLANS_FILE)) {
      console.log("Reading plans.json file...");
      const content = fs.readFileSync(PLANS_FILE, 'utf-8');
      const plans = JSON.parse(content);
      
      console.log(`Migrating ${plans.length} plans...`);
      for (const plan of plans) {
        await db.collection('plans').doc(String(plan.id)).set(plan);
        console.log(`- Plan ID '${plan.id}' (${plan.title}) migrated.`);
      }
    } else {
      console.log("No plans.json found. Skipping plan migration.");
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed with error:", err);
    process.exit(1);
  }
};

migrate();
