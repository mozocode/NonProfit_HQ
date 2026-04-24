export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

import { FALLBACK_FIREBASE_WEB_CONFIG } from "@/config/firebaseWebConfig";

const ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

/**
 * Validates that required Firebase env vars are set. In development, logs warnings; in production, returns false so callers can guard.
 */
export function validateFirebaseEnv(): boolean {
  const resolved = getFirebaseClientConfig();
  const missing = ENV_KEYS.filter((key) => {
    switch (key) {
      case "NEXT_PUBLIC_FIREBASE_API_KEY":
        return !resolved.apiKey.trim();
      case "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN":
        return !resolved.authDomain.trim();
      case "NEXT_PUBLIC_FIREBASE_PROJECT_ID":
        return !resolved.projectId.trim();
      case "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET":
        return !resolved.storageBucket.trim();
      case "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID":
        return !resolved.messagingSenderId.trim();
      case "NEXT_PUBLIC_FIREBASE_APP_ID":
        return !resolved.appId.trim();
      default:
        return true;
    }
  });
  if (missing.length === 0) return true;
  if (process.env.NODE_ENV === "development") {
    console.warn("[env] Missing Firebase config:", missing.join(", "), "- copy .env.example to .env.local");
  }
  return false;
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const env = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  return {
    apiKey: env.apiKey || FALLBACK_FIREBASE_WEB_CONFIG.apiKey,
    authDomain: env.authDomain || FALLBACK_FIREBASE_WEB_CONFIG.authDomain,
    projectId: env.projectId || FALLBACK_FIREBASE_WEB_CONFIG.projectId,
    storageBucket: env.storageBucket || FALLBACK_FIREBASE_WEB_CONFIG.storageBucket,
    messagingSenderId: env.messagingSenderId || FALLBACK_FIREBASE_WEB_CONFIG.messagingSenderId,
    appId: env.appId || FALLBACK_FIREBASE_WEB_CONFIG.appId,
  };
}
