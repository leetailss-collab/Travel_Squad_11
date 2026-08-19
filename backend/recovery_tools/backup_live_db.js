const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase-service-account.json');
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function createBackup() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupDir = path.join(__dirname, '../backups', `backup_${dateStr}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`=== Backing up Firestore data to ${backupDir} ===`);

  // Plans
  const plansSnap = await db.collection('plans').get();
  const plansData = [];
  plansSnap.forEach(doc => plansData.push({ ...doc.data(), _id: doc.id }));
  plansData.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  fs.writeFileSync(path.join(backupDir, `plans_${dateStr}.json`), JSON.stringify(plansData, null, 2), 'utf8');

  // Users
  const usersSnap = await db.collection('users').get();
  const usersData = [];
  usersSnap.forEach(doc => usersData.push({ ...doc.data(), _id: doc.id }));
  fs.writeFileSync(path.join(backupDir, `users_${dateStr}.json`), JSON.stringify(usersData, null, 2), 'utf8');

  // Combined
  fs.writeFileSync(path.join(backupDir, `full_database_backup_${dateStr}.json`), JSON.stringify({
    backupDate: new Date().toISOString(),
    plans: plansData,
    users: usersData
  }, null, 2), 'utf8');

  console.log(`✔ Backup completed! Saved ${plansData.length} plans and ${usersData.length} users.`);
}

createBackup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
