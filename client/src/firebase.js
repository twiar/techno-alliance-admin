import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "technoalliance-41e1e.firebaseapp.com",
  projectId: "technoalliance-41e1e",
  storageBucket: "technoalliance-41e1e.appspot.com",
  messagingSenderId: "163493959315",
  appId: "1:163493959315:web:238582f6a45a005fecdf66",
  measurementId: "G-LXSPQ0M5G6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const storage = getStorage(app);