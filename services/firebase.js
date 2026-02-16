import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function readEnv(name) {
  const value = process.env?.[name];
  return typeof value === "string" ? value.trim() : "";
}

const rawFirebaseConfig = {
  apiKey: readEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
  databaseURL: readEnv("EXPO_PUBLIC_FIREBASE_DATABASE_URL"),
  measurementId: readEnv("EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID"),
};

const missingConfigKeys = Object.entries({
  apiKey: rawFirebaseConfig.apiKey,
  authDomain: rawFirebaseConfig.authDomain,
  projectId: rawFirebaseConfig.projectId,
  storageBucket: rawFirebaseConfig.storageBucket,
  messagingSenderId: rawFirebaseConfig.messagingSenderId,
  appId: rawFirebaseConfig.appId,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

const firebaseConfig = {
  apiKey: rawFirebaseConfig.apiKey || "MISSING_FIREBASE_API_KEY",
  authDomain: rawFirebaseConfig.authDomain || "MISSING_FIREBASE_AUTH_DOMAIN",
  projectId: rawFirebaseConfig.projectId || "MISSING_FIREBASE_PROJECT_ID",
  storageBucket: rawFirebaseConfig.storageBucket || "MISSING_FIREBASE_STORAGE_BUCKET",
  messagingSenderId:
    rawFirebaseConfig.messagingSenderId || "MISSING_FIREBASE_MESSAGING_SENDER_ID",
  appId: rawFirebaseConfig.appId || "MISSING_FIREBASE_APP_ID",
  ...(rawFirebaseConfig.databaseURL ? { databaseURL: rawFirebaseConfig.databaseURL } : {}),
  ...(rawFirebaseConfig.measurementId
    ? { measurementId: rawFirebaseConfig.measurementId }
    : {}),
};

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
  if (missingConfigKeys.length > 0) {
    throw new Error(
      `Firebase config missing: ${missingConfigKeys.join(", ")}. Set EXPO_PUBLIC_FIREBASE_* in .env.local.`,
    );
  }
}

export async function getCurrentIdToken(forceRefresh = false) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  return currentUser.getIdToken(forceRefresh);
}

export { auth, db, firebaseApp };
