const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// 1. Initialize Firebase Admin
const initializeFirebase = () => {
  if (getApps().length > 0) return;
  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log("Initializing Firebase...");
    const serviceAccount = require(serviceAccountPath);
    const projectId = serviceAccount.project_id;
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${projectId}.firebasestorage.app`
    });
  } else {
    console.error("Error: firebase-service-account.json not found! Please run this script where the key file exists.");
    process.exit(1);
  }
};

initializeFirebase();
const db = getFirestore();
const bucket = getStorage().bucket();

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

const migrate = async () => {
  try {
    console.log("=== Starting Image Migration to Firebase Storage ===");
    console.log(`Scanning local uploads directory: ${UPLOADS_DIR}`);

    // Fetch all plans from Firestore
    const plansSnapshot = await db.collection('plans').get();
    const eventsSnapshot = await db.collection('events').get();
    
    const allDocs = [];
    plansSnapshot.forEach(doc => allDocs.push({ id: doc.id, data: doc.data(), collection: 'plans' }));
    eventsSnapshot.forEach(doc => allDocs.push({ id: doc.id, data: doc.data(), collection: 'events' }));

    console.log(`Found ${allDocs.length} plans/events to check.`);

    let totalMigrated = 0;

    for (const docInfo of allDocs) {
      const plan = docInfo.data;
      let planModified = false;

      if (!plan.itinerary) continue;

      for (let dayItem of plan.itinerary) {
        if (!dayItem.places) continue;

        for (let place of dayItem.places) {
          if (place.images && place.images.length > 0) {
            const updatedImages = [];

            for (let imgUrl of place.images) {
              // Only migrate if the image has a local relative path starting with /uploads/
              if (imgUrl.startsWith('/uploads/')) {
                const filename = imgUrl.replace('/uploads/', '');
                const localFilePath = path.join(UPLOADS_DIR, filename);

                if (fs.existsSync(localFilePath)) {
                  console.log(`Found local image: ${filename}. Uploading to Cloud Storage...`);
                  
                  const destination = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`;
                  const fileRef = bucket.file(destination);

                  // Upload file to GCS bucket
                  await fileRef.save(fs.readFileSync(localFilePath), {
                    metadata: {
                      contentType: getContentType(filename)
                    }
                  });

                  // Generate far-future Signed URL
                  const [signedUrl] = await fileRef.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2076' // 50 years expiration
                  });

                  console.log(`-> Uploaded successfully! New URL: ${signedUrl}`);
                  updatedImages.push(signedUrl);
                  totalMigrated++;
                  planModified = true;
                } else {
                  console.warn(`⚠️ Warning: Local file not found at ${localFilePath}. Keeping original path.`);
                  updatedImages.push(imgUrl);
                }
              } else {
                // Keep already migrated or external URLs
                updatedImages.push(imgUrl);
              }
            }

            place.images = updatedImages;
          }
        }
      }

      if (planModified) {
        console.log(`Updating plan/event ${plan.id} (${plan.title}) in collection '${docInfo.collection}'...`);
        await db.collection(docInfo.collection).doc(String(plan.id)).set(plan);
      }
    }

    console.log(`=== Migration completed! Total images migrated: ${totalMigrated} ===`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed with error:", err);
    process.exit(1);
  }
};

// Helper function to get mime type
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
};

migrate();
