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

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || "mozodevelopment@gmail.com";
const ORG_ID = process.env.BOOTSTRAP_ORG_ID || "org_demo";
const ORG_NAME = process.env.BOOTSTRAP_ORG_NAME || "NonProfit HQ";

function initAdmin() {
  if (admin.apps.length) return;

  const credPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectOverride = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

  if (credPathRaw) {
    const credPath = path.resolve(credPathRaw.replace(/^["']|["']$/g, ""));
    if (!fs.existsSync(credPath)) {
      console.error("GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist:");
      console.error("  ", credPath);
      console.error("");
      console.error("Use the real path to the JSON key from:");
      console.error("  Firebase Console → Project settings → Service accounts → Generate new private key");
      console.error("Example:");
      console.error('  export GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/nonprofithq-xxxxx.json"');
      process.exit(1);
    }
    const sa = JSON.parse(fs.readFileSync(credPath, "utf8"));
    const projectId = projectOverride || sa.project_id;
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId,
    });
    console.log("Firebase Admin using project:", projectId, "(from service account JSON)\n");
    return;
  }

  console.warn(
    "GOOGLE_APPLICATION_CREDENTIALS is not set — using Application Default Credentials.",
  );
  console.warn("If the wrong Google account is active, Auth may query a different project.\n");
  admin.initializeApp({
    projectId: projectOverride || "nonprofithq",
  });
}

async function main() {
  initAdmin();

  const auth = admin.auth();
  const db = admin.firestore();

  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      console.error(`No Firebase Auth user for "${EMAIL}" in this Firebase project.`);
      console.error("");
      console.error("Fix:");
      console.error("  1. Open Firebase Console and select the SAME project as your service account (project_id in the JSON).");
      console.error("  2. Authentication → Users → Add user → email + password.");
      console.error("  3. Re-run: npm run bootstrap-admin");
      console.error("");
      console.error("Or set a different email: BOOTSTRAP_ADMIN_EMAIL=you@example.com npm run bootstrap-admin");
    } else {
      console.error(e.message || e);
    }
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
