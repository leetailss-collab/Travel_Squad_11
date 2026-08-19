const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase-service-account.json');
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function restoreSinglePlan() {
  const jsonPathArg = process.argv[2];
  if (!jsonPathArg) {
    console.error('Usage: node restore_single_plan.js <path_to_plan_json>');
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(jsonPathArg) ? jsonPathArg : path.join(process.cwd(), jsonPathArg);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const planObj = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const planId = String(planObj.id);

  if (!planId) {
    console.error('Invalid plan JSON: missing id property.');
    process.exit(1);
  }

  console.log(`Restoring Plan ID ${planId}: "${planObj.title}"...`);

  // 1. Update Firestore single document
  await db.collection('plans').doc(planId).set(planObj);
  console.log(`✔ Firestore plans/${planId} set successfully!`);

  // 2. Update local plans.json
  const plansJsonPath = path.join(__dirname, '../data/plans.json');
  let plansList = [];
  if (fs.existsSync(plansJsonPath)) {
    plansList = JSON.parse(fs.readFileSync(plansJsonPath, 'utf8'));
  }

  plansList = plansList.filter(p => String(p.id) !== planId);
  plansList.push(planObj);
  plansList.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  fs.writeFileSync(plansJsonPath, JSON.stringify(plansList, null, 2), 'utf8');
  console.log(`✔ backend/data/plans.json updated with Plan ${planId}`);
}

restoreSinglePlan().then(() => {
  console.log('\nPlan restoration successfully finished!');
  process.exit(0);
}).catch(err => {
  console.error('Restoration failed:', err);
  process.exit(1);
});
