/**
 * Detect stale families (no interaction in X days) and create overdue follow-up prompts for assigned staff.
 */

import { getFirestore } from "firebase-admin/firestore";
import { REMINDER_CONFIG } from "../config";
import { createStaffPrompt } from "../helpers/reminders";
import { notifyStaff } from "../notifications";

const db = getFirestore();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function runStaleCaseDetection(): Promise<{ promptsCreated: number }> {
  const cutoff = daysAgo(REMINDER_CONFIG.STALE_CASE_DAYS);
  const cutoffIso = cutoff.toISOString();
  let promptsCreated = 0;

  const familiesSnap = await db.collection("families").get();

  for (const familyDoc of familiesSnap.docs) {
    const familyId = familyDoc.id;
    const data = familyDoc.data();
    const organizationId = data.organizationId as string;

    // Last interaction on this family
    const lastInteractionSnap = await db
      .collection("interactions")
      .where("organizationId", "==", organizationId)
      .where("familyId", "==", familyId)
      .orderBy("occurredAt", "desc")
      .limit(1)
      .get();

    const lastInteractionAt = lastInteractionSnap.empty
      ? null
      : (lastInteractionSnap.docs[0].data().occurredAt as string);
    if (lastInteractionAt && lastInteractionAt > cutoffIso) continue;

    // Family is stale; get assigned staff
    const assignmentsSnap = await db
      .collection("staffAssignments")
      .where("organizationId", "==", organizationId)
      .where("familyId", "==", familyId)
      .get();

    const primaryContact = (data.primaryContactName as string) ?? "Family";
    const title = `Follow up: ${primaryContact} (no contact in ${REMINDER_CONFIG.STALE_CASE_DAYS}+ days)`;
    const dueAt = new Date().toISOString();

    for (const assignDoc of assignmentsSnap.docs) {
      const staffUid = assignDoc.data().staffUid as string;

      // Avoid duplicate prompt for same family/staff
      const existing = await db
        .collection("staffActionPrompts")
        .where("organizationId", "==", organizationId)
        .where("staffUid", "==", staffUid)
        .where("familyId", "==", familyId)
        .where("type", "==", "stale_case")
        .where("completedAt", "==", null)
        .limit(1)
        .get();
      if (!existing.empty) continue;

      await createStaffPrompt({
        organizationId,
        staffUid,
        type: "stale_case",
        dueAt,
        title,
        familyId,
        targetId: familyId,
        createdByUid: "system",
      });
      promptsCreated++;

      await notifyStaff({
        staffUid,
        organizationId,
        title: "Stale case: follow up needed",
        body: title,
        type: "prompt",
      });
    }
  }

  return { promptsCreated };
}
