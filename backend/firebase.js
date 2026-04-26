const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

let db = null;

try {
  // Check if we have the individual Firebase credentials in .env
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual newlines in the private key string
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("🔥 Firebase initialized successfully.");
  } else {
    console.log("⚠️ Firebase credentials missing from .env. Running with in-memory storage fallback.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error.message);
  console.log("⚠️ Falling back to in-memory storage.");
}

module.exports = { db };
