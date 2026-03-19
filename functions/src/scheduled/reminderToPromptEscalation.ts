/**
 * Create staff action prompts when reminders remain unresolved after threshold.
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

export async function runReminderToPromptEscalation(): Promise<{ promptsCreated: number }> {
  const threshold = daysAgo(REMINDER_CONFIG.REMINDER_TO_PROMPT_THRESHOLD_DAYS);
  const thresholdIso = threshold.toISOString();
  let promptsCreated = 0;

  const remindersSnap = await db
    .collection("reminders")
    .where("acknowledgedAt", "==", null)
    .get();

  for (const docSnap of remindersSnap.docs) {
    const data = docSnap.data();
    const sentAt = data.sentAt as string | null;
    if (!sentAt || sentAt > thresholdIso) continue;

    const organizationId = data.organizationId as string;
    const assignedToUid = data.assignedToUid as string | null;
    if (!assignedToUid) continue;

    const type = data.type as string;
    const title = (data.title as string) ?? "Unresolved reminder";
    const dueAt = data.dueAt as string;
    const familyId = data.familyId as string | null;
    const targetId = data.targetId as string;

    // Check we don't already have an open prompt for this reminder
    const existingPrompt = await db
      .collection("staffActionPrompts")
      .where("organizationId", "==", organizationId)
      .where("staffUid", "==", assignedToUid)
      .where("targetId", "==", targetId)
      .where("completedAt", "==", null)
      .limit(1)
      .get();
    if (!existingPrompt.empty) continue;

    const promptType =
      type === "missing_document" ? "missing_document"
      : type === "overdue_follow_up" ? "overdue_follow_up"
      : "overdue_admin_action";

    await createStaffPrompt({
      organizationId,
      staffUid: assignedToUid,
      type: promptType,
      dueAt,
      title: `Action required: ${title}`,
      familyId,
      targetId,
      createdByUid: "system",
    });
    promptsCreated++;

    await notifyStaff({
      staffUid: assignedToUid,
      organizationId,
      title: "Action prompt created",
      body: `A reminder was not acknowledged. Please address: ${title}`,
      type: "prompt",
    });
  }

  return { promptsCreated };
}
