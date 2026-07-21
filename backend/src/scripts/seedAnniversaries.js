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

const ANNIVERSARIES = [
  { name: "이진수 생일", month: 1, day: 19, isLunar: false },
  { name: "이해성 생일", month: 2, day: 20, isLunar: false },
  { name: "홍영숙 생신", month: 2, day: 17, isLunar: true },
  { name: "합동차례", month: 3, day: 10, isLunar: true },
  { name: "이준성 생일", month: 3, day: 24, isLunar: false },
  { name: "방예선 생신", month: 3, day: 12, isLunar: true },
  { name: "이정우 생신", month: 5, day: 10, isLunar: true },
  { name: "이현수 생일", month: 7, day: 7, isLunar: false },
  { name: "박경희 기일", month: 7, day: 19, isLunar: true },
  { name: "할아버지 기일", month: 12, day: 8, isLunar: true },
  { name: "양슬기 생일", month: 12, day: 14, isLunar: false }
];

const run = async () => {
  try {
    console.log("Seeding family anniversaries to Firestore 'anniversaries' collection...");
    for (const ann of ANNIVERSARIES) {
      const id = `ann-${ann.name.replace(/\s+/g, '')}`;
      const docData = {
        id,
        name: ann.name,
        month: ann.month,
        day: ann.day,
        isLunar: ann.isLunar
      };
      await db.collection('anniversaries').doc(id).set(docData);
      console.log(`- Seeded: ${ann.name} (${ann.isLunar ? '음력' : '양력'} ${ann.month}/${ann.day})`);
    }
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed anniversaries:", err);
    process.exit(1);
  }
};

run();
