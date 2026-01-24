import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDUWHfB3N4dSbhgRrbxiG1tHfXjBvr0V0",
  authDomain: "athleteiq-b26ec.firebaseapp.com",
  projectId: "athleteiq-b26ec",
  storageBucket: "athleteiq-b26ec.firebasestorage.app",
  messagingSenderId: "1097567774554",
  appId: "1:1097567774554:web:21ef1aed42955d6e5c3563",
  measurementId: "G-CMLBDGJ15K"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
