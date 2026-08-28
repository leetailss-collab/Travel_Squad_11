const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const backendPath = path.join(__dirname, '../firebase-service-account.json');
const rootPath = path.join(__dirname, '../../firebase-service-account.json');
const serviceAccountPath = fs.existsSync(backendPath) ? backendPath : (fs.existsSync(rootPath) ? rootPath : null);

if (!serviceAccountPath) {
  console.error("Service account key not found!");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = getFirestore();

async function checkAndSwap() {
  const haseongDoc = await db.collection('users').doc('이하성').get();
  const juseongDoc = await db.collection('users').doc('이주성').get();

  const haseongData = haseongDoc.data() || {};
  const juseongData = juseongDoc.data() || {};

  console.log("=== CURRENT FIRESTORE PROFILE IMAGES ===");
  console.log("이하성 (2021년생):", haseongData.profileImage);
  console.log("이주성 (2023년생):", juseongData.profileImage);

  const haseongImg = haseongData.profileImage;
  const juseongImg = juseongData.profileImage;

  // Swap in Firestore
  await db.collection('users').doc('이하성').update({
    profileImage: juseongImg
  });

  await db.collection('users').doc('이주성').update({
    profileImage: haseongImg
  });

  console.log("\n✅ SUCCESSFULLY SWAPPED PROFILE IMAGES!");
  console.log("이하성 (2021년생) -> NEW IMAGE:", juseongImg);
  console.log("이주성 (2023년생) -> NEW IMAGE:", haseongImg);
}

checkAndSwap().catch(console.error);
