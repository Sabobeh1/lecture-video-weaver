
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

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

// Initialize Analytics in browser environment only
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();

// Connect to Firestore emulator in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export { app, analytics };
