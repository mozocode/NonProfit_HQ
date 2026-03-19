# Phase 21 — Admin weekly planned vs actual oversight

## Routes

| Path | Description |
|------|-------------|
| `/admin/weekly-oversight` | Organization summary + per-staff comparison table with expand/drill-down |
| `/admin/weekly-oversight/staff/[staffUid]` | Single-staff week picker + full drill-down |

Constants: `ROUTES.ADMIN_WEEKLY_OVERSIGHT`, `ROUTES.ADMIN_WEEKLY_OVERSIGHT_STAFF(uid)`.

## Metrics

- **Planned items**: count of agenda line items (all sections).
- **Completed items**: count of weekly report activity rows.
- **Hours planned**: sum of optional `AgendaLineItem.estimatedHours` when any line has a value; otherwise `—`.
- **Hours reported**: report header `totalHours`, or sum of line `hoursSpent`.
- **Missing report submission**: report not in `submitted` / `reviewed` display state (aligned with Phase 19 `missingSubmission`).
- **Missing agenda**: no agenda document for the week (`updatedAt` empty on read path).
- **Tasks**: open (`todo` / `in_progress` / `blocked`) goal tasks with `dueDate` in the week (Sun–Sat), `assignedToUid` set.
- **Overdue**: subset of those tasks with `dueDate` before today’s calendar date (reference day).

## Oversight status (badges)

| Status | Rule (simplified) |
|--------|-------------------|
| `missing_report` | No report or not submitted/reviewed |
| `needs_review` | Report `submitted` |
| `partially_completed` | Report `reviewed` but fewer report rows than planned rows |
| `on_track` | Report `reviewed` and counts aligned (or no plan) |

## Key files

| Area | Path |
|------|------|
| Types | `src/types/weeklyOversight.ts` |
| Aggregation | `src/lib/weeklyOversightUtils.ts` |
| Service | `src/services/firestore/weeklyOversightService.ts` |
| Tasks query | `src/services/firestore/goalsTasksService.ts` — `listOpenTasksDueInWeekByStaff` |
| Hooks | `src/hooks/useWeeklyOversight.ts` |
| UI | `src/features/weekly-planning/weekly-oversight/*` |
| Domain (optional hours) | `AgendaLineItem.estimatedHours` in `src/types/domain.ts` |

## Firestore

Uses existing `staffWeeklyAgendas`, `staffWeeklyReports`, `staffReportItems`, and **collection group** `goalTasks` filtered by `organizationId` (same pattern as other admin queries). No new indexes required for the task query beyond existing `organizationId` filters.

## Drill-down links

Report rows and tasks link to staff routes (`STAFF_FAMILY`, `STAFF_TASK`, `STAFF_FAMILY_GOAL`) so admins who also have staff access can open caseload context.

## Related

- Phase 19: `docs/PHASE19-weekly-planning-reporting.md`, `/admin/weekly-submissions`
