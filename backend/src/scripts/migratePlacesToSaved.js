const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Initialize Firebase Admin
const initializeFirebase = () => {
  if (getApps().length > 0) return;
  const backendPath = path.join(__dirname, '../firebase-service-account.json');
  const rootPath = path.join(__dirname, '../../firebase-service-account.json');
  const serviceAccountPath = fs.existsSync(backendPath) ? backendPath : (fs.existsSync(rootPath) ? rootPath : null);
  
  if (serviceAccountPath) {
    console.log(`Initializing Firebase with key found at: ${serviceAccountPath}`);
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    console.error("Error: firebase-service-account.json not found!");
    process.exit(1);
  }
};

initializeFirebase();
const db = getFirestore();

// Geocoding helper using OpenStreetMap Nominatim (Standard https module to avoid dependencies)
const geocodeAddress = (address) => {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const options = {
      headers: {
        'User-Agent': 'TravelSquadMigrationScript/1.0'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve({ lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`Geocoding error for ${address}:`, err.message);
      resolve(null);
    });
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const migrate = async () => {
  try {
    console.log("=== Starting Itinerary Places to Saved Places Migration ===");

    // Fetch all plans and events from Firestore
    const plansSnapshot = await db.collection('plans').get();
    const eventsSnapshot = await db.collection('events').get();
    
    const allDocs = [];
    plansSnapshot.forEach(doc => allDocs.push({ id: doc.id, data: doc.data(), collection: 'plans' }));
    eventsSnapshot.forEach(doc => allDocs.push({ id: doc.id, data: doc.data(), collection: 'events' }));

    console.log(`Found ${allDocs.length} plans/events to analyze.`);

    let totalMigrated = 0;

    for (const docInfo of allDocs) {
      const plan = docInfo.data;
      let planModified = false;

      if (!plan.itinerary) continue;
      
      // Initialize savedPlaces array
      plan.savedPlaces = plan.savedPlaces || [];
      console.log(`\nChecking plan: "${plan.title}" (ID: ${docInfo.id})`);

      for (let dayItem of plan.itinerary) {
        if (!dayItem.places) continue;

        for (let place of dayItem.places) {
          // Check if place has an address
          if (place.address && place.address.trim() !== '') {
            const cleanAddress = place.address.trim();
            
            // Check if this place is already saved (by name or address)
            const alreadySaved = plan.savedPlaces.some(
              sp => sp.name.trim().toLowerCase() === place.name.trim().toLowerCase() ||
                    sp.address.trim().toLowerCase() === cleanAddress.toLowerCase()
            );

            if (!alreadySaved) {
              console.log(`Found new candidate place: "${place.name}" with address "${cleanAddress}"`);
              
              // Geocode the address
              console.log(`Geocoding address...`);
              const coords = await geocodeAddress(cleanAddress);
              if (coords) {
                console.log(`-> Coords found: ${coords.lat}, ${coords.lng}`);
              } else {
                console.log(`-> Coords not found. Saving without coordinates.`);
              }

              // Create saved place object
              const savedPlaceObj = {
                id: `sp-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
                name: place.name,
                category: place.category || '관광',
                address: cleanAddress,
                description: place.description || '',
                tip: place.tip || '',
                url: place.url || (plan.currency === 'KRW'
                  ? `https://map.naver.com/p/search/${encodeURIComponent(cleanAddress || place.name)}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress || place.name)}`),
                lat: coords ? coords.lat : null,
                lng: coords ? coords.lng : null
              };

              plan.savedPlaces.push(savedPlaceObj);
              planModified = true;
              totalMigrated++;

              // Nominatim requires at least 1s rate limit
              await sleep(1000);
            }
          }
        }
      }

      if (planModified) {
        console.log(`Updating plan "${plan.title}" in collection "${docInfo.collection}"...`);
        await db.collection(docInfo.collection).doc(docInfo.id).set(plan);
        console.log(`Plan "${plan.title}" updated successfully!`);
      } else {
        console.log(`No new places to migrate for plan "${plan.title}".`);
      }
    }

    console.log(`\n=== Migration Finished! Total new places added: ${totalMigrated} ===`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();
