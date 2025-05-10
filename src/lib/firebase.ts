
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPJ2x065CFGBvvnP9bk0UuSskksjn0fvs",
  authDomain: "graduationproject-586b4.firebaseapp.com",
  projectId: "graduationproject-586b4",
  storageBucket: "graduationproject-586b4.firebasestorage.app",
  messagingSenderId: "768361417737",
  appId: "1:768361417737:web:8e39f7a2e773356506bcd8",
  measurementId: "G-FD00BFZYHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
