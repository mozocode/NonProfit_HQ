/**
 * Configuration for Cloud Functions automations.
 * Tune these for your organization's SLA and reminder cadence.
 */

export const REMINDER_CONFIG = {
  /** Days after requirement creation before first missing-document reminder is sent. */
  MISSING_DOCUMENT_FIRST_REMINDER_DAYS: 3,
  /** Interval (days) between repeat reminders until document uploaded or request closed. */
  MISSING_DOCUMENT_REPEAT_DAYS: 7,
  /** Days after reminder sent with no acknowledgment before a staff action prompt is created. */
  REMINDER_TO_PROMPT_THRESHOLD_DAYS: 2,
  /** Days with no interaction on a family/case before considered "stale" and triggering overdue follow-up. */
  STALE_CASE_DAYS: 14,
} as const;

export const SCHEDULE_CONFIG = {
  /** Cron for daily org summary (e.g. 8:00 AM). */
  DAILY_SUMMARY_CRON: "0 8 * * *",
  /** Day and time to remind staff to submit weekly agenda (e.g. Monday 9:00). */
  AGENDA_REMINDER_CRON: "0 9 * * 1",
  /** Day and time to remind staff to submit weekly report (e.g. Friday 4:00 PM). */
  REPORT_REMINDER_CRON: "0 16 * * 5",
} as const;
