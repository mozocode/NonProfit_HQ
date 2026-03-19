import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getFirebaseClientConfig, validateFirebaseEnv } from "@/lib/env";

/**
 * Initialize Firebase only in browser to avoid SSR issues. Returns null during SSR.
 */
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  const config = getFirebaseClientConfig();
  if (!config.apiKey) {
    validateFirebaseEnv();
    return null;
  }
  return getApps().length ? getApp() : initializeApp(config);
}

const firebaseApp = getFirebaseApp();

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const firestoreDb: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;
