/**
 * Missing document reminders: send after X days, repeat every 7 days until uploaded or closed.
 * Notify assigned staff when reminder is sent.
 */

import { getFirestore } from "firebase-admin/firestore";
import { REMINDER_CONFIG } from "../config";
import { createReminder } from "../helpers/reminders";
import { notifyStaff } from "../notifications";

const db = getFirestore();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function toIso(date: Date): string {
  return date.toISOString();
}

export async function runMissingDocumentReminders(): Promise<{ remindersCreated: number }> {
  const now = new Date();
  const firstReminderThreshold = daysAgo(REMINDER_CONFIG.MISSING_DOCUMENT_FIRST_REMINDER_DAYS);
  const repeatThreshold = daysAgo(REMINDER_CONFIG.MISSING_DOCUMENT_REPEAT_DAYS);
  let remindersCreated = 0;

  const requirementsSnap = await db
    .collection("familyDocumentRequirements")
    .where("status", "==", "missing")
    .get();

  for (const docSnap of requirementsSnap.docs) {
    const data = docSnap.data();
    const organizationId = data.organizationId as string;
    const familyId = data.familyId as string;
    const templateId = data.templateId as string;
    const requirementId = docSnap.id;

    // Get template name for title
    let templateName = "Required document";
    try {
      const templateSnap = await db
        .collection("requiredDocumentTemplates")
        .doc(templateId)
        .get();
      if (templateSnap.exists) {
        templateName = (templateSnap.data()?.name as string) ?? templateName;
      }
    } catch {
      // ignore
    }

    // Get assigned staff for this family
    const assignmentsSnap = await db
        .collection("staffAssignments")
        .where("organizationId", "==", organizationId)
        .where("familyId", "==", familyId)
        .limit(1)
        .get();
    const assignedToUid = assignmentsSnap.empty ? null : (assignmentsSnap.docs[0].data().staffUid as string);

    // Check for existing reminder for this requirement (to decide first vs repeat)
    const existingRemindersSnap = await db
      .collection("reminders")
      .where("organizationId", "==", organizationId)
      .where("targetId", "==", requirementId)
      .where("type", "==", "missing_document")
      .get();

    const dueAt = data.dueDate ? new Date(data.dueDate as string) : now;
    const title = `${templateName} due for family`;

    if (existingRemindersSnap.empty) {
      // First reminder: only if requirement is old enough
      const createdAt = data.createdAt ? new Date(data.createdAt as string) : now;
      if (createdAt > firstReminderThreshold) continue;

      await createReminder({
        organizationId,
        type: "missing_document",
        targetId: requirementId,
        familyId,
        title,
        assignedToUid,
        dueAt: toIso(dueAt),
        createdBy: "system",
      });
      remindersCreated++;

      if (assignedToUid) {
        await notifyStaff({
          staffUid: assignedToUid,
          organizationId,
          title: `Reminder: ${templateName}`,
          body: `A required document (${templateName}) is missing for a family on your caseload.`,
          type: "reminder",
        });
      }
    } else {
      // Repeat: last reminder sent at least REPEAT_DAYS ago
      const lastReminder = existingRemindersSnap.docs
        .map((d) => d.data().sentAt as string)
        .filter(Boolean)
        .sort()
        .pop();
      if (!lastReminder || new Date(lastReminder) > repeatThreshold) continue;

      await createReminder({
        organizationId,
        type: "missing_document",
        targetId: requirementId,
        familyId,
        title: `(Repeat) ${title}`,
        assignedToUid,
        dueAt: toIso(dueAt),
        createdBy: "system",
      });
      remindersCreated++;

      if (assignedToUid) {
        await notifyStaff({
          staffUid: assignedToUid,
          organizationId,
          title: `Repeat reminder: ${templateName}`,
          body: `Reminder: required document (${templateName}) is still missing.`,
          type: "reminder",
        });
      }
    }
  }

  return { remindersCreated };
}
