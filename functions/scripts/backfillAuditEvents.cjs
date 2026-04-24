/* eslint-disable no-console */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function main() {
  const snap = await db.collection("auditLogs").limit(5000).get();
  if (snap.empty) {
    console.log("no legacy auditLogs found");
    return;
  }
  let created = 0;
  const batch = db.batch();
  for (const doc of snap.docs) {
    const data = doc.data();
    const nextRef = db.collection("auditEvents").doc();
    batch.set(nextRef, {
      organizationId: data.organizationId ?? null,
      actorUid: data.actorUid ?? null,
      actorEmail: data.actorEmail ?? null,
      action: data.action ?? "export_generated",
      entityType: data.entityType ?? "export",
      entityId: data.entityId ?? doc.id,
      metadata: data.metadata ?? { backfilledFrom: "auditLogs" },
      createdAt: data.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
    });
    created += 1;
  }
  await batch.commit();
  await db.collection("systemJobs").add({
    type: "pilotAuditBackfill",
    sourceCollection: "auditLogs",
    createdAuditEvents: created,
    executedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "completed",
  });
  console.log(`backfilled ${created} audit events`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
