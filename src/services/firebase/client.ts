import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

import { type FirebaseClientConfig, getFirebaseClientConfig, validateFirebaseEnv } from "@/lib/env";

let runtimeInitPromise: Promise<FirebaseApp | null> | null = null;

function resolveFirebaseAppSync(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (getApps().length) return getApp();
  const config = getFirebaseClientConfig();
  if (!config.apiKey?.trim()) {
    validateFirebaseEnv();
    return null;
  }
  return initializeApp(config);
}

/**
 * Ensures Firebase is initialized in the browser: uses build-time env first,
 * then fetches `/api/firebase-config` (server reads runtime env on App Hosting).
 */
export function ensureFirebaseAppAsync(): Promise<FirebaseApp | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const sync = resolveFirebaseAppSync();
  if (sync) return Promise.resolve(sync);

  if (!runtimeInitPromise) {
    runtimeInitPromise = fetch("/api/firebase-config", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as Partial<FirebaseClientConfig> & { error?: string };
        if (data.error || !data.apiKey?.trim()) return null;
        const full: FirebaseClientConfig = {
          apiKey: data.apiKey,
          authDomain: String(data.authDomain ?? ""),
          projectId: String(data.projectId ?? ""),
          storageBucket: String(data.storageBucket ?? ""),
          messagingSenderId: String(data.messagingSenderId ?? ""),
          appId: String(data.appId ?? ""),
        };
        if (getApps().length) return getApp();
        return initializeApp(full);
      })
      .catch(() => null);
  }

  return runtimeInitPromise;
}

function resolveFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (getApps().length) return getApp();
  return resolveFirebaseAppSync();
}

/** Browser-only; null during SSR or before ensureFirebaseAppAsync() when using runtime config. */
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
