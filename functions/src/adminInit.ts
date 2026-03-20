/**
 * Must be imported first from index.ts so Firebase Admin exists before any
 * module calls getFirestore() at load time (Firebase CLI deploy analysis).
 */
import { getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp();
}
