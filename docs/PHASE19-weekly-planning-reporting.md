# Phase 19 — Staff weekly planning & reporting

## Features

### Staff (`/staff/agenda`, `/staff/report`)
- **Agenda**: week range (Sun–Sat), sections for planned meetings, family follow-ups, referrals, admin tasks, week notes. Save draft, submit before **submission deadline** (`weekEnd` + grace days, see `WEEKLY_SUBMISSION_GRACE_DAYS` in `src/lib/weeklyPlanningUtils.ts`).
- **Report**: same week picker, week-level notes, **activity rows** (description, family link, location, category, hours, notes) via reusable **`ReportItemEntryForm`**. Submit locks editing after deadline (or once submitted/reviewed).
- **Statuses** (stored + display): `draft`, `submitted`, `overdue` (auto-persisted when `draft` past `submissionDueAt`), `reviewed` (admin).
- **Previous weeks**: week dropdown (last ~16 weeks).

### Admin (`/admin/weekly-submissions`)
- Filter **report/agenda tables** by staff and optional week (“All weeks” supported).
- Separate **comparison week** for agenda vs report grid, expandable detail, and **missing report submission** list.
- **Mark reviewed** on submitted agendas/reports.

## Data model (Firestore)

| Collection | Doc ID pattern | Notes |
|------------|----------------|--------|
| `staffWeeklyAgendas` | `ag_{orgId}_{staffUid}_{weekStart}` | Structured planned arrays + `notes`, `status`, `submissionDueAt`, review fields |
| `staffWeeklyReports` | `rp_{orgId}_{staffUid}_{weekStart}` | Header doc + `totalHours`, `notes`, status |
| `staffReportItems` | random | `organizationId`, `reportId`, activity fields |

**Index**: `staffReportItems` — `organizationId` + `reportId` (see `firestore.indexes.json`).

## Key files

| Area | Path |
|------|------|
| Domain | `src/types/domain.ts` — `WeeklySubmissionStatus`, `AgendaLineItem`, updated `StaffWeeklyAgenda`, `StaffWeeklyReport`, `StaffReportItem` |
| View types | `src/types/weeklyPlanning.ts` |
| Utils | `src/lib/weeklyPlanningUtils.ts` |
| Service | `src/services/firestore/weeklyPlanningService.ts` |
| Hooks | `src/hooks/useWeeklyPlanning.ts` |
| UI | `src/features/weekly-planning/*` |
| Staff routes | `src/app/(dashboard)/staff/agenda/page.tsx`, `staff/report/page.tsx` |
| Admin route | `src/app/(dashboard)/admin/weekly-submissions/page.tsx` |
| Constants | `ROUTES.ADMIN_WEEKLY_SUBMISSIONS` |
| Quick link | `src/features/admin-dashboard/AdminQuickLinks.tsx` |

## Legacy data

Older agendas with only `items[]` are **migrated in memory** into the new sections when read. Older report items using `description` / `durationMinutes` are mapped to `activityDescription` / `hoursSpent`.
