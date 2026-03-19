# Phase 18 — Admin Command Center

## Summary

Admin-only **Command Center** at `/admin` with:

- **Overview metric cards** (families, participants, active staff, cases, overdue follow-ups, missing docs, referrals in progress, completed referrals in range).
- **Filters**: date range (activity + referral completion window), school, partner, program (reuses `resolveSegmentFamilyIds` / link logic from reporting).
- **Recent activity**: merged feed of interactions, document uploads, referrals, and audit/workflow events.
- **Staff oversight**: profiles, last activity, open assigned tasks (filtered families), overdue action prompts, weekly report & agenda status for current week (Sunday-based week start).
- **Quick links**: schedule, reporting, schools, partners, exports (`ROUTES.ADMIN_*`).

## Files

| Area | Path |
|------|------|
| Types | `src/types/commandCenter.ts` |
| Services | `src/services/firestore/adminCommandCenterService.ts`, `src/services/firestore/adminDirectoryService.ts` |
| Reporting helper | `src/services/firestore/adminReportingService.ts` — exports `resolveFamilyIdsForSegments`, `resolveSegmentFamilyIds` |
| Hooks | `src/hooks/useAdminCommandCenter.ts` |
| UI | `src/features/admin-dashboard/*` |
| Admin home | `src/features/dashboard/AdminDashboardView.tsx` → `AdminCommandCenterView` |
| Routes | `src/app/(dashboard)/admin/page.tsx`, `admin/schools`, `partners`, `schedule`, `exports` |
| Constants | `src/constants/index.ts` — `ADMIN_SCHEDULE`, `ADMIN_EXPORTS`, `ADMIN_SCHOOLS`, `ADMIN_PARTNERS` |
| Indexes | `firestore.indexes.json` — `interactions` (org + `occurredAt`), `referrals` (org + `referredAt`), `staffScheduleEntries` (org + `startAt`) |

## Firestore notes

- Activity queries use **organizationId + orderBy** where noted; deploy indexes after first query errors.
- Referral feed falls back to unsorted fetch + client sort if the new composite index is not deployed yet.
- **Completed referrals** in overview: `status === "completed"` and `completedAt` or `referredAt` within the selected **date range**.

## Role protection

All pages wrap `RoleGate allow={["admin"]}` (same as existing admin area).
