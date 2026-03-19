# Phase 6: Staff dashboard

## Overview

The staff dashboard shows assigned families, overdue follow-ups, missing documents, upcoming tasks, reminders, recently updated cases, this week’s agenda, today’s schedule, and unresolved action prompts. Quick filters, summary cards, and an action list support click-through to family profile, task details, missing document reminders, schedule, and weekly agenda/report.

## Routes

| Path | Purpose |
|------|---------|
| `/staff` | Main dashboard (summary cards, filters, action list, sections) |
| `/staff/family/[familyId]` | Family profile placeholder (click-through from families, documents, reminders) |
| `/staff/task/[taskId]` | Task detail placeholder (click-through from tasks, overdue, reminders) |
| `/staff/schedule` | Today’s schedule placeholder |
| `/staff/agenda` | This week’s agenda form placeholder |
| `/staff/report` | Submit weekly report placeholder |

All `/staff/*` routes are wrapped by the staff layout: `RoleGate allow={["staff", "admin"]}` and `AppShell`.

## Service layer

- **`src/services/staff/staffDashboardService.ts`**  
  - `getDashboardData(organizationId, staffUid)`  
  - Returns a single `StaffDashboardData` object (summary counts + all lists).  
  - Currently uses **mock data** from `getMockStaffDashboardData()`.  
  - TODO: Replace with Firestore queries (families, staffAssignments, goalTasks, familyDocumentRequirements, reminders, staffWeeklyAgendas, staffScheduleEntries, staffActionPrompts).

- **`src/services/staff/mockStaffDashboard.ts`**  
  - Mock lists and `getMockStaffDashboardData(organizationId, staffUid)` for development.

## Hooks

- **`src/hooks/useStaffDashboard.ts`**  
  - Uses `useAuth()` for `orgId` and `user.uid`.  
  - Calls `staffDashboardService.getDashboardData(orgId, staffUid)`.  
  - Exposes `{ data, isLoading, error, refetch, orgId, staffUid }`.

## Dashboard UI (StaffDashboardView)

- **Summary cards:** Assigned families, overdue follow-ups, missing documents, upcoming tasks, reminders to ack, action prompts (StatCard grid).
- **Quick filters:** FilterBar with All | Overdue | Tasks | Documents | Reminders for the action list.
- **Action list:** Combined overdue, missing docs, reminders, and upcoming tasks with click-through to family or task page.
- **Sections:**  
  - Assigned families → link to `/staff/family/[id]`  
  - Today’s schedule → link to `/staff/schedule`  
  - This week’s agenda → link to `/staff/agenda`  
  - Upcoming tasks → TaskCard links to `/staff/task/[id]`  
  - Missing documents → link to family profile  
  - Reminders needing acknowledgment → link to family or task  
  - Recently updated cases → link to family profile  
  - Unresolved action prompts → link to report or agenda
- **Header:** “Submit weekly report” button → `/staff/report`.

## Types

- **`src/types/staffDashboard.ts`**  
  - View types: `StaffAssignedFamily`, `StaffOverdueFollowUp`, `StaffMissingDocument`, `StaffUpcomingTask`, `StaffReminder`, `StaffRecentCase`, `StaffAgendaItem`, `StaffWeeklyAgendaView`, `StaffScheduleEntryView`, `StaffActionPromptView`, `StaffDashboardSummary`, `StaffDashboardData`.

## Files created

| File | Purpose |
|------|---------|
| `src/constants/index.ts` | Added `STAFF_FAMILY(id)`, `STAFF_TASK(id)`, `STAFF_SCHEDULE`, `STAFF_AGENDA`, `STAFF_REPORT` |
| `src/types/staffDashboard.ts` | Dashboard view types |
| `src/services/staff/mockStaffDashboard.ts` | Mock data and `getMockStaffDashboardData` |
| `src/services/staff/staffDashboardService.ts` | `getDashboardData` (mock; ready for Firebase) |
| `src/hooks/useStaffDashboard.ts` | Dashboard data hook |
| `src/features/dashboard/StaffDashboardView.tsx` | Full dashboard UI |
| `src/app/(dashboard)/staff/layout.tsx` | RoleGate + AppShell for all `/staff/*` |
| `src/app/(dashboard)/staff/page.tsx` | Renders `StaffDashboardView` only |
| `src/app/(dashboard)/staff/family/[familyId]/page.tsx` | Family profile placeholder |
| `src/app/(dashboard)/staff/task/[taskId]/page.tsx` | Task detail placeholder |
| `src/app/(dashboard)/staff/schedule/page.tsx` | Schedule placeholder |
| `src/app/(dashboard)/staff/agenda/page.tsx` | Agenda placeholder |
| `src/app/(dashboard)/staff/report/page.tsx` | Report placeholder |
| `docs/PHASE6-STAFF-DASHBOARD.md` | This doc |

## Files changed

- **`src/app/(dashboard)/staff/page.tsx`**  
  - Only renders `StaffDashboardView`; layout provides RoleGate and AppShell.

## Firebase integration (later)

- Replace `getMockStaffDashboardData` usage in `staffDashboardService.getDashboardData` with:
  - `staffAssignments` + `families` for assigned families
  - `goalTasks` / `tasks` for overdue and upcoming tasks
  - `familyDocumentRequirements` for missing documents
  - `reminders` for reminders needing ack
  - Cases / interactions for recently updated cases
  - `staffWeeklyAgendas` for this week’s agenda
  - `staffScheduleEntries` for today’s schedule
  - `staffActionPrompts` for unresolved prompts
- Add real CRUD and listeners on family, task, schedule, agenda, and report pages.
