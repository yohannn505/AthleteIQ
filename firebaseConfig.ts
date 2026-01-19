import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Note: We are removing getAnalytics for now as it causes issues in Expo Go

const firebaseConfig = {
  apiKey: "AIzaSyDDUWHfB3N4dSbhgRrbxiG1tHfXjBvr0V0",
  authDomain: "athleteiq-b26ec.firebaseapp.com",
  projectId: "athleteiq-b26ec",
  storageBucket: "athleteiq-b26ec.firebasestorage.app",
  messagingSenderId: "1097567774554",
  appId: "1:1097567774554:web:21ef1aed42955d6e5c3563",
  measurementId: "G-CMLBDGJ15K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and EXPORT them so index.tsx can see them
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
