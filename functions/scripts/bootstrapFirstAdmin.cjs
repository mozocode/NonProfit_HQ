/**
 * One-time bootstrap: grant admin custom claims + organization + membership + profile.
 *
 * Prereqs:
 * 1. Firebase Auth user already exists (e.g. mozodevelopment@gmail.com) — Authentication → Add user.
 * 2. Run with Admin credentials (service account JSON recommended):
 *    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 *    Or: gcloud auth application-default login  (user must be Owner/Editor on the GCP project)
 *
 * Usage (from repo root):
 *   cd functions && npm run bootstrap-admin
 *
 * Optional env:
 *   BOOTSTRAP_ADMIN_EMAIL   default: mozodevelopment@gmail.com
 *   BOOTSTRAP_ORG_ID        default: org_demo
 *   BOOTSTRAP_ORG_NAME      default: NonProfit HQ
 *   GCLOUD_PROJECT          optional; else inferred from credentials
 */

const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || "mozodevelopment@gmail.com";
const ORG_ID = process.env.BOOTSTRAP_ORG_ID || "org_demo";
const ORG_NAME = process.env.BOOTSTRAP_ORG_NAME || "NonProfit HQ";

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
  } catch (e) {
    console.error(
      `No Firebase Auth user for "${EMAIL}". Create the user in Firebase Console → Authentication first.`,
    );
    process.exit(1);
  }

  await auth.setCustomUserClaims(user.uid, { orgId: ORG_ID, role: "admin" });

  await db
    .collection("organizations")
    .doc(ORG_ID)
    .set(
      {
        name: ORG_NAME,
        status: "active",
        settings: {
          timezone: "America/New_York",
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await db
    .collection("organizationMemberships")
    .doc(`${ORG_ID}_${user.uid}`)
    .set(
      {
        organizationId: ORG_ID,
        uid: user.uid,
        role: "admin",
        active: true,
        programIds: [],
        invitedBy: null,
        joinedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await db
    .collection("profiles")
    .doc(user.uid)
    .set(
      {
        displayName: user.displayName || "Admin",
        email: user.email || EMAIL,
        phone: user.phoneNumber ?? null,
        lastActiveAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log("Bootstrap complete.");
  console.log("  uid:     ", user.uid);
  console.log("  email:   ", user.email);
  console.log("  orgId:   ", ORG_ID);
  console.log("  role:    admin");
  console.log("");
  console.log("Sign out of the app (if logged in) and sign in again so the new custom claims load.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
