import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "@firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO(TASK05): Replace placeholders with your real Firebase Web App config.
const firebaseConfig = {
  apiKey: "TODO_FIREBASE_API_KEY",
  authDomain: "TODO_FIREBASE_AUTH_DOMAIN",
  projectId: "TODO_FIREBASE_PROJECT_ID",
  storageBucket: "TODO_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "TODO_FIREBASE_MESSAGING_SENDER_ID",
  appId: "TODO_FIREBASE_APP_ID",
};

const hasPlaceholderConfig = Object.values(firebaseConfig).some((value) =>
  String(value || "").startsWith("TODO_"),
);

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(firebaseApp);
}

const db = getFirestore(firebaseApp);

export function assertFirebaseConfigured() {
  if (hasPlaceholderConfig) {
    throw new Error(
      "Firebase config is missing. Update services/firebase.js with real project keys.",
    );
  }
}

export { auth, db, firebaseApp };
