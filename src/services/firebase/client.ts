import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getFirebaseClientConfig, validateFirebaseEnv } from "@/lib/env";

/**
 * Resolve Firebase app lazily on each access so we never "lock in" null from an SSR
 * evaluation of this module. `NEXT_PUBLIC_*` must still be set at build time for production.
 */
function resolveFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  const config = getFirebaseClientConfig();
  if (!config.apiKey) {
    validateFirebaseEnv();
    return null;
  }
  return getApps().length ? getApp() : initializeApp(config);
}

/** Browser-only; null during SSR or when env is missing. */
export function getFirebaseAuth(): Auth | null {
  const app = resolveFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirestoreDb(): Firestore | null {
  const app = resolveFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseStorageInstance(): FirebaseStorage | null {
  const app = resolveFirebaseApp();
  return app ? getStorage(app) : null;
}
