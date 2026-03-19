/**
 * Notification, reminder, and staff prompt view types and enums for UI.
 */

import type { ReminderType, StaffActionPromptType } from "@/types/domain";

export type { ReminderType, StaffActionPromptType };

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  missing_document: "Missing document",
  overdue_follow_up: "Overdue follow-up",
  pending_referral: "Pending referral",
  stale_case: "Stale case",
  missing_weekly_agenda: "Missing weekly agenda",
  missing_weekly_report: "Missing weekly report",
  overdue_admin_action: "Overdue admin action",
  task: "Task",
  document: "Document",
  interaction: "Interaction",
};

export const PROMPT_TYPE_LABELS: Record<StaffActionPromptType, string> = {
  missing_document: "Missing document",
  overdue_follow_up: "Overdue follow-up",
  pending_referral: "Pending referral",
  stale_case: "Stale case",
  missing_weekly_agenda: "Missing weekly agenda",
  missing_weekly_report: "Missing weekly report",
  overdue_admin_action: "Overdue admin action",
  admin_follow_up: "Admin follow-up",
};

export interface ReminderView {
  reminderId: string;
  type: ReminderType;
  targetId: string;
  familyId: string | null;
  familyName: string | null;
  title: string;
  dueAt: string;
  acknowledgedAt: string | null;
  assignedToUid: string | null;
}

export interface StaffActionPromptView {
  promptId: string;
  type: StaffActionPromptType;
  dueAt: string;
  title: string;
  completedAt: string | null;
  familyId: string | null;
  targetId: string | null;
  actionLogCount: number;
  createdByAdmin: boolean;
}

export interface PromptActionLogEntryView {
  date: string;
  method: string;
  outcome: string;
  loggedAt: string;
  loggedByUid: string;
}

export interface LogActionInput {
  date: string;
  method: string;
  outcome: string;
}

export interface AttentionSummaryItem {
  id: string;
  type: "reminder" | "prompt";
  title: string;
  dueAt: string;
  familyId: string | null;
  familyName: string | null;
  href: string;
  kind: string;
}

export interface AttentionSummary {
  items: AttentionSummaryItem[];
  count: number;
}
