/**
 * Helpers for creating reminders and staff action prompts in Firestore.
 * Used by scheduled functions and (optionally) callable handlers.
 */

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export type ReminderType =
  | "missing_document"
  | "overdue_follow_up"
  | "pending_referral"
  | "stale_case"
  | "missing_weekly_agenda"
  | "missing_weekly_report"
  | "overdue_admin_action"
  | "task"
  | "document"
  | "interaction";

export type StaffActionPromptType =
  | "missing_document"
  | "overdue_follow_up"
  | "pending_referral"
  | "stale_case"
  | "missing_weekly_agenda"
  | "missing_weekly_report"
  | "overdue_admin_action"
  | "admin_follow_up";

function nowIso(): string {
  return new Date().toISOString();
}

export interface CreateReminderInput {
  organizationId: string;
  type: ReminderType;
  targetId: string;
  familyId: string | null;
  title: string;
  assignedToUid: string | null;
  dueAt: string;
  createdBy?: string | null;
}

/**
 * Create a reminder document. Returns the new reminder ID.
 */
export async function createReminder(input: CreateReminderInput): Promise<string> {
  const ref = db.collection("reminders").doc();
  const now = nowIso();
  await ref.set({
    organizationId: input.organizationId,
    reminderId: ref.id,
    type: input.type,
    targetId: input.targetId,
    familyId: input.familyId,
    title: input.title ?? null,
    assignedToUid: input.assignedToUid,
    dueAt: input.dueAt,
    sentAt: now,
    acknowledgedAt: null,
    createdBy: input.createdBy ?? "system",
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export interface CreateStaffPromptInput {
  organizationId: string;
  staffUid: string;
  type: StaffActionPromptType;
  dueAt: string;
  title: string;
  familyId?: string | null;
  targetId?: string | null;
  createdByUid?: string | null;
}

/**
 * Create a staff action prompt. Returns the new prompt ID.
 */
export async function createStaffPrompt(input: CreateStaffPromptInput): Promise<string> {
  const ref = db.collection("staffActionPrompts").doc();
  const now = nowIso();
  await ref.set({
    organizationId: input.organizationId,
    staffUid: input.staffUid,
    promptId: ref.id,
    type: input.type,
    dueAt: input.dueAt,
    completedAt: null,
    familyId: input.familyId ?? null,
    targetId: input.targetId ?? null,
    title: input.title ?? null,
    createdByUid: input.createdByUid ?? null,
    actionLog: [],
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}
