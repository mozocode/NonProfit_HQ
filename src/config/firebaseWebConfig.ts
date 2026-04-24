import type { FirebaseClientConfig } from "@/lib/env";

/**
 * Public Firebase Web SDK config (safe to ship to browsers).
 * These values match Firebase Console -> Project settings -> Your apps -> Web app.
 */
export const FALLBACK_FIREBASE_WEB_CONFIG: FirebaseClientConfig = {
  apiKey: "AIzaSyDUfeplU2kNP9gOLiyIiEiEdJDHnfHlP6I",
  authDomain: "nonprofithq.firebaseapp.com",
  projectId: "nonprofithq",
  storageBucket: "nonprofithq.firebasestorage.app",
  messagingSenderId: "809206325550",
  appId: "1:809206325550:web:ff0c983b11dfd0369d5abf",
};
