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

// Path to 일정.txt
const TEXT_FILE_PATH = path.join(__dirname, '../../../일정.txt');

const run = async () => {
  try {
    console.log(`1. Reading anniversaries from: ${TEXT_FILE_PATH}`);
    if (!fs.existsSync(TEXT_FILE_PATH)) {
      console.error("일정.txt not found at the expected path!");
      process.exit(1);
    }
    
    const content = fs.readFileSync(TEXT_FILE_PATH, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    
    console.log("2. Clearing existing documents in Firestore 'anniversaries' collection...");
    const snapshot = await db.collection('anniversaries').get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("- Existing anniversaries collection cleared.");
    
    console.log("3. Parsing and uploading new anniversaries...");
    for (const line of lines) {
      // Expect format "Name: YYYY.MM.DD"
      if (!line.includes(':')) continue;
      
      const parts = line.split(':');
      let rawName = parts[0].trim();
      const rawDate = parts[1].trim();
      
      // Determine lunar status and clean name
      let isLunar = false;
      if (rawName.includes('(음력)')) {
        isLunar = true;
        rawName = rawName.replace('(음력)', '').trim();
      }
      
      // Clean up spaces if any
      const name = rawName;
      
      // Parse date YYYY.MM.DD
      const dateParts = rawDate.split('.').map(Number);
      if (dateParts.length !== 3) {
        console.warn(`Skipping invalid date line: ${line}`);
        continue;
      }
      const [year, month, day] = dateParts;
      
      // Determine event type
      let type = 'other';
      if (name.includes('생일') || name.includes('생신')) {
        type = 'birthday';
      } else if (name.includes('기일')) {
        type = 'memorial';
      }
      
      const id = `ann-${name.replace(/\s+/g, '')}`;
      const docData = {
        id,
        name,
        year,
        month,
        day,
        isLunar,
        type
      };
      
      await db.collection('anniversaries').doc(id).set(docData);
      console.log(`- Uploaded: "${name}" (${isLunar ? '음력' : '양력'} 기준년도: ${year}년 ${month}/${day}, 타입: ${type})`);
    }
    
    console.log("Parsing and seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to parse and seed anniversaries:", err);
    process.exit(1);
  }
};

run();
