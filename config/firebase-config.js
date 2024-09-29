const admin = require('firebase-admin');
const serviceAccount = require('./rail-tech-firebase-adminsdk-fpi5y-b6884e206b.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

console.log("Firebase Admin Initialized.");
const db = admin.firestore();

module.exports = db;