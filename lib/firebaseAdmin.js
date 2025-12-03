// lib/firebaseAdmin.js
import admin from "firebase-admin";

let app;
if (!admin.apps || admin.apps.length === 0) {
  const saJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJSON) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");

  const serviceAccount = JSON.parse(saJSON);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { admin as firebaseAdmin, db, bucket };
