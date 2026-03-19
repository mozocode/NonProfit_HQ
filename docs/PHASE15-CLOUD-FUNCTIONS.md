# Phase 15: Cloud Functions for Automations

## Overview

Scheduled and event-driven Cloud Functions for missing-document reminders, reminder escalation to staff action prompts, stale-case detection, daily org summary, weekly agenda/report reminders, admin overdue notifications, and reporting snapshots. Notification senders are stubbed for later integration (email, FCM).

## 1. Helper interfaces and config

### Config (`functions/src/config.ts`)

- **REMINDER_CONFIG**
  - `MISSING_DOCUMENT_FIRST_REMINDER_DAYS` (default 3)
  - `MISSING_DOCUMENT_REPEAT_DAYS` (default 7)
  - `REMINDER_TO_PROMPT_THRESHOLD_DAYS` (default 2)
  - `STALE_CASE_DAYS` (default 14)
- **SCHEDULE_CONFIG**: cron expressions for daily summary, agenda reminder, report reminder

### Notification stubs (`functions/src/notifications.ts`)

- **notifyStaff(payload)** – staff in-app/email; stub logs only
- **notifyAdmins(payload)** – org admins; stub logs only
- **sendEmail(payload)** – generic email; stub logs only

Replace with real implementations (e.g. FCM for in-app, SendGrid/Trigger Email for email).

### Reminder helpers (`functions/src/helpers/reminders.ts`)

- **createReminder(input)** – writes to `reminders` with `organizationId`, `type`, `targetId`, `familyId`, `title`, `assignedToUid`, `dueAt`, `sentAt`, `acknowledgedAt`, `createdBy`, `createdAt`, `updatedAt`
- **createStaffPrompt(input)** – writes to `staffActionPrompts` with `organizationId`, `staffUid`, `type`, `dueAt`, `title`, `familyId`, `targetId`, `createdByUid`, `actionLog`, etc.

Used by scheduled functions and (optionally) callable handlers. App reads the same collections.

## 2. Scheduled functions

| Function | Schedule | Description |
|----------|----------|-------------|
| **reminderDispatcher** | Every 15 min | Run missing-document reminders (first after X days, repeat every 7 days); notify assigned staff; create staff action prompt if reminder still unacknowledged after threshold |
| **escalationWorkflow** | Every 60 min | Stale-case detection: no interaction in X days → create overdue follow-up staff prompt, notify staff |
| **dailyOrgSummary** | 0 8 * * * (8:00 AM daily) | Per-org summary (e.g. missing docs count, unack reminders count); notify admins (stub) |
| **weeklyAgendaReminder** | 0 9 * * 1 (Monday 9 AM) | Staff without agenda for next week → create prompt, notify staff |
| **weeklyAgendaOverdueNotifyAdmin** | 0 9 * * 2 (Tuesday 9 AM) | Notify admins which staff have not submitted agenda |
| **weeklyReportReminder** | 0 16 * * 5 (Friday 4 PM) | Staff without report for current week → create prompt, notify staff |
| **weeklyReportOverdueNotifyAdmin** | 0 10 * * 6 (Saturday 10 AM) | Notify admins which staff have not submitted report |
| **reportingSnapshots** | 0 1 * * * (1:00 AM daily) | Write `organizationMetricsSnapshots` with period dimensions (families count, missing docs, unack reminders) for dashboard |

Legacy placeholders still present: **weeklyAgendaCompiler**, **weeklyReportRollup** (write to `systemJobs` only).

## 3. Event-driven usage

- No new Firestore-onWrite/onCreate triggers in this phase; all automations are scheduled.
- Future: trigger on `familyDocumentRequirements` update (e.g. status → uploaded) to stop repeat reminders, or on `reminders` create to fan-out notifications.

## 4. App–function interaction

- **Reminders**: Functions create docs in `reminders`; app reads via `getRemindersForStaff` / `getRemindersForOrganization` and updates `acknowledgedAt` via `acknowledgeReminder`.
- **Staff action prompts**: Functions create docs in `staffActionPrompts`; app reads via `getStaffPrompts`, updates `completedAt` and `actionLog` via `completeStaffPrompt` and `logPromptAction`.
- **Snapshots**: Functions write `organizationMetricsSnapshots`; app (or admin dashboard) can query by `organizationId` and `periodStart`/`periodEnd` for metrics.

No callable functions were added for these automations; all are scheduled. Existing callables: `setOrgUserClaims`, `reportExportGenerator`.

## 5. Deployment notes

- **Indexes**: Ensure composite indexes exist for:
  - `reminders`: (organizationId, assignedToUid, dueAt), (organizationId, acknowledgedAt)
  - `familyDocumentRequirements`: (organizationId, status)
  - `staffActionPrompts`: (organizationId, staffUid, dueAt), (organizationId, staffUid, completedAt), (organizationId, staffUid, type, completedAt)
  - `interactions`: (organizationId, familyId, occurredAt desc)
  - `staffWeeklyAgendas`: (organizationId, staffUid, weekStart)
  - `staffWeeklyReports`: (organizationId, staffUid, weekStart)
- **Secrets**: None required for stubbed notifications. When adding email/FCM, use Firebase config or Secret Manager.
- **Deploy**: `firebase deploy --only functions` (or `npm run deploy` in `functions/`).
- **Emulator**: `npm run serve` in `functions/` to run emulator; scheduled functions can be triggered manually in the Emulator UI.

## 6. Files created/updated

| Path | Change |
|------|--------|
| `functions/src/config.ts` | **New** – REMINDER_CONFIG, SCHEDULE_CONFIG |
| `functions/src/notifications.ts` | **New** – notifyStaff, notifyAdmins, sendEmail stubs |
| `functions/src/helpers/reminders.ts` | **New** – createReminder, createStaffPrompt |
| `functions/src/scheduled/missingDocumentReminders.ts` | **New** – runMissingDocumentReminders |
| `functions/src/scheduled/reminderToPromptEscalation.ts` | **New** – runReminderToPromptEscalation |
| `functions/src/scheduled/staleCaseDetection.ts` | **New** – runStaleCaseDetection |
| `functions/src/scheduled/dailyOrgSummary.ts` | **New** – runDailyOrgSummary |
| `functions/src/scheduled/weeklyAgendaReminder.ts` | **New** – runWeeklyAgendaReminder, runWeeklyAgendaOverdueNotifyAdmin |
| `functions/src/scheduled/weeklyReportReminder.ts` | **New** – runWeeklyReportReminder, runWeeklyReportOverdueNotifyAdmin |
| `functions/src/scheduled/reportingSnapshots.ts` | **New** – runReportingSnapshots |
| `functions/src/index.ts` | Imports and wires reminderDispatcher, escalationWorkflow, dailyOrgSummary, weeklyAgendaReminder, weeklyAgendaOverdueNotifyAdmin, weeklyReportReminder, weeklyReportOverdueNotifyAdmin, reportingSnapshots |
