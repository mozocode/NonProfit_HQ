# Phase 14: Notifications, Reminders, and Staff Accountability UI

## Overview

In-app reminder center, reminder types (missing document, overdue follow-up, pending referral, stale case, missing weekly agenda/report, overdue admin action), staff acknowledgment, action logging (date, method, outcome), "what needs attention" on the dashboard, and distinction between participant notifications and staff prompts.

## 1. Domain and view types

### Reminder (`src/types/domain.ts`)

- **ReminderType**: `missing_document` | `overdue_follow_up` | `pending_referral` | `stale_case` | `missing_weekly_agenda` | `missing_weekly_report` | `overdue_admin_action` | `task` | `document` | `interaction`
- **Reminder**: `organizationId`, `reminderId`, `type`, `targetId`, `familyId`, `title`, `assignedToUid`, `dueAt`, `sentAt`, `acknowledgedAt`, `createdBy`, `createdAt`, `updatedAt`

### StaffActionPrompt

- **StaffActionPromptType**: same as above + `admin_follow_up`
- **PromptActionLogEntry**: `date`, `method`, `outcome`, `loggedAt`, `loggedByUid`
- **StaffActionPrompt**: `organizationId`, `staffUid`, `promptId`, `type`, `dueAt`, `completedAt`, `familyId`, `targetId`, `title`, `createdByUid`, `actionLog[]`, `createdAt`, `updatedAt`

### View types (`src/types/notifications.ts`)

- **ReminderView**, **StaffActionPromptView**, **LogActionInput**, **AttentionSummaryItem**, **AttentionSummary**
- **REMINDER_TYPE_LABELS**, **PROMPT_TYPE_LABELS** for UI

## 2. Firestore service (`src/services/firestore/remindersPromptsService.ts`)

- **getRemindersForStaff(organizationId, staffUid, options?)** – reminders for a staff user; optional `unacknowledgedOnly` / `acknowledgedOnly`
- **getRequirementsByFamily** – (not in this file; see documentsService)
- **acknowledgeReminder(organizationId, reminderId, acknowledgedByUid)** – set `acknowledgedAt`, preserve immutable fields
- **getStaffPrompts(organizationId, staffUid, completedOnly)** – unresolved or completed prompts
- **getStaffPrompt(organizationId, promptId)** – single prompt
- **getStaffPromptWithActionLog(organizationId, promptId)** – prompt + full action log
- **completeStaffPrompt(organizationId, promptId, completedByUid)** – set `completedAt`
- **logPromptAction(organizationId, promptId, loggedByUid, input)** – append to `actionLog`

## 3. Hooks (`src/hooks/useRemindersPrompts.ts`)

- **useRemindersForStaff(options?)** – list reminders, optional filter
- **useStaffPrompts(options?)** – list prompts (unresolved or completed)
- **useStaffPromptDetail(promptId)** – single prompt with action log
- **useAcknowledgeReminder()** – `acknowledge(reminderId)`
- **useCompletePrompt()** – `complete(promptId)`
- **useLogPromptAction()** – `logAction(promptId, input)`
- **useAttentionSummary()** – merged list of unack reminders + unresolved prompts for "what needs attention"

## 4. UI components

### ReminderCard (`src/features/reminders/ReminderCard.tsx`)

- Shows type label, title, family, due date; "Ack" button and "View" link

### PromptCard (`src/features/reminders/PromptCard.tsx`)

- Shows type, title, action log count, due date; "Log action", "Complete", "View"

### LogActionSheet (`src/features/reminders/LogActionSheet.tsx`)

- Form: date, method, outcome; calls `onLog(input)` then closes

### WhatNeedsAttentionSection (`src/features/reminders/WhatNeedsAttentionSection.tsx`)

- Daily "what needs attention" list with link to reminder center; shows items from `useAttentionSummary()`

### ReminderCenterView (`src/features/reminders/ReminderCenterView.tsx`)

- Tabs: All / Reminders / Action prompts
- Reminders: filter Needing ack / Acknowledged / All; list with ReminderCard and acknowledge
- Prompts: list with PromptCard, "Log action" opens LogActionSheet, "Complete" marks done
- Page: `/staff/reminders`

## 5. Dashboard integration

- **StaffDashboardView**: "Reminder center" link in header; **WhatNeedsAttentionSection** at top (items + loading from `useAttentionSummary()`); existing "Reminders needing acknowledgment" and "Unresolved action prompts" sections unchanged (mock or hook data).

## 6. Permissions and participant vs staff

- Reminders and staffActionPrompts: read for active org members; create/update for staff; immutable fields preserved on update.
- Participant notifications: not implemented in this phase; can be a separate collection (e.g. `participantNotifications`) and shown only on participant dashboard later.
- Admin-created prompts: supported via `createdByUid` and type `admin_follow_up`; admin can create prompts via Firestore or a future admin UI.

## 7. Files created/updated

| Path | Change |
|------|--------|
| `src/types/domain.ts` | ReminderType, Reminder (familyId, title, acknowledgedAt, createdBy), StaffActionPromptType, PromptActionLogEntry, StaffActionPrompt (familyId, targetId, title, createdByUid, actionLog) |
| `src/types/notifications.ts` | **New** – REMINDER_TYPE_LABELS, PROMPT_TYPE_LABELS, ReminderView, StaffActionPromptView, LogActionInput, AttentionSummaryItem, AttentionSummary |
| `src/types/staffDashboard.ts` | StaffReminder.type string; StaffActionPromptView extended (familyId, targetId, actionLogCount, createdByAdmin) |
| `src/services/firestore/remindersPromptsService.ts` | **New** – reminders and prompts CRUD + acknowledge + log action |
| `firestore.rules` | reminders/staffActionPrompts update rules (explicit immutable field check) |
| `firestore.indexes.json` | staffActionPrompts (organizationId, staffUid, dueAt) |
| `src/hooks/useRemindersPrompts.ts` | **New** – useRemindersForStaff, useStaffPrompts, useStaffPromptDetail, useAcknowledgeReminder, useCompletePrompt, useLogPromptAction, useAttentionSummary |
| `src/features/reminders/ReminderCard.tsx` | **New** |
| `src/features/reminders/PromptCard.tsx` | **New** |
| `src/features/reminders/LogActionSheet.tsx` | **New** |
| `src/features/reminders/WhatNeedsAttentionSection.tsx` | **New** |
| `src/features/reminders/ReminderCenterView.tsx` | **New** |
| `src/app/(dashboard)/staff/reminders/page.tsx` | **New** |
| `src/features/dashboard/StaffDashboardView.tsx` | WhatNeedsAttentionSection, Reminder center link, useAttentionSummary |
| `src/constants/index.ts` | STAFF_REMINDERS (if not already present) |
