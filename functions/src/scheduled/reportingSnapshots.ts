/**
 * Generate reporting snapshots for dashboard performance metrics.
 * Writes to organizationMetricsSnapshots for org-wide counts.
 */

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

function periodBounds(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setDate(0);
  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
}

export async function runReportingSnapshots(): Promise<{ snapshotsCreated: number }> {
  const { periodStart, periodEnd } = periodBounds();
  const now = new Date().toISOString();
  let snapshotsCreated = 0;

  const orgsSnap = await db.collection("organizations").get();

  for (const orgDoc of orgsSnap.docs) {
    const organizationId = orgDoc.id;

    const snapshotId = `${organizationId}_${periodStart}_${periodEnd}`;

    const familiesSnap = await db
      .collection("families")
      .where("organizationId", "==", organizationId)
      .get();
    const requirementsMissingSnap = await db
      .collection("familyDocumentRequirements")
      .where("organizationId", "==", organizationId)
      .where("status", "==", "missing")
      .get();
    const remindersUnackSnap = await db
      .collection("reminders")
      .where("organizationId", "==", organizationId)
      .where("acknowledgedAt", "==", null)
      .get();

    await db
      .collection("organizationMetricsSnapshots")
      .doc(snapshotId)
      .set(
        {
          organizationId,
          snapshotId,
          periodStart,
          periodEnd,
          dimensions: {
            familiesCount: familiesSnap.size,
            missingDocumentsCount: requirementsMissingSnap.size,
            unacknowledgedRemindersCount: remindersUnackSnap.size,
          },
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    snapshotsCreated++;
  }

  return { snapshotsCreated };
}
