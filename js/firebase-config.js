// Firebase Web SDK Configuration
// Using ES Modules from official Firebase CDN (v10.8.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyC4J8UqXPI9ysm05I51zjy8Iy_QneqPxs8",
  authDomain: "schoolmgt-6fcfb.firebaseapp.com",
  projectId: "schoolmgt-6fcfb",
  storageBucket: "schoolmgt-6fcfb.firebasestorage.app",
  messagingSenderId: "229368337869",
  appId: "1:229368337869:web:ae87ed6a57e57e17d36084",
  measurementId: "G-SG9444T184"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize and export commonly used Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;
