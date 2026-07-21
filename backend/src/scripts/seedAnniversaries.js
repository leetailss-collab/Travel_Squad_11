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
  { name: "이진수 생일", year: 1985, month: 1, day: 19, isLunar: false, type: "birthday" },
  { name: "이해성 생일", year: 2020, month: 2, day: 20, isLunar: false, type: "birthday" },
  { name: "홍영숙 생신", year: 1963, month: 2, day: 17, isLunar: true, type: "birthday" },
  { name: "합동차례", year: 2024, month: 3, day: 10, isLunar: true, type: "other" },
  { name: "이준성 생일", year: 2011, month: 3, day: 24, isLunar: false, type: "birthday" },
  { name: "방예선 생신", year: 2017, month: 3, day: 12, isLunar: true, type: "birthday" },
  { name: "이정우 생신", year: 1957, month: 5, day: 10, isLunar: true, type: "birthday" },
  { name: "이현수 생일", year: 1987, month: 7, day: 7, isLunar: false, type: "birthday" },
  { name: "박경희 기일", year: 2008, month: 7, day: 19, isLunar: true, type: "memorial" },
  { name: "할아버지 기일", year: 2018, month: 12, day: 8, isLunar: true, type: "memorial" },
  { name: "양슬기 생일", year: 1987, month: 12, day: 14, isLunar: false, type: "birthday" }
];

const run = async () => {
  try {
    console.log("Seeding detailed family anniversaries (with years & types) to Firestore...");
    for (const ann of ANNIVERSARIES) {
      const id = `ann-${ann.name.replace(/\s+/g, '')}`;
      const docData = {
        id,
        name: ann.name,
        year: ann.year,
        month: ann.month,
        day: ann.day,
        isLunar: ann.isLunar,
        type: ann.type
      };
      await db.collection('anniversaries').doc(id).set(docData);
      console.log(`- Seeded: ${ann.name} (${ann.isLunar ? '음력' : '양력'} 기준년도: ${ann.year}년 ${ann.month}/${ann.day}, 타입: ${ann.type})`);
    }
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed anniversaries:", err);
    process.exit(1);
  }
};

run();
