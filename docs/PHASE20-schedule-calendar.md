# Phase 20 — Staff schedule & calendar

## Routes

- **Staff:** `/staff/schedule` → `StaffScheduleView` (today + week, own entries).
- **Admin:** `/admin/schedule` → `AdminScheduleView` (org day/week, per-staff week, overview table, seed demo).

## Data model

- Firestore collection: `staffScheduleEntries` (see `StaffScheduleEntry` in `src/types/domain.ts`).
- Optional future sync: `syncSource`, `externalCalendarEventId` (not used by UI yet).

## Services & hooks

- `src/services/firestore/scheduleService.ts` — CRUD, org-wide listing, `adminStaffDaySummary`.
- `src/services/firestore/scheduleSeedDemo.ts` — `seedDemoScheduleData(orgId, staffUids[])`.
- `src/hooks/useSchedule.ts` — `useStaffScheduleRange`, `useAdminScheduleRange` (supports `enabled`), `useAdminStaffDaySummary`.

## Firestore indexes

Deploy `firestore.indexes.json` composite indexes on `staffScheduleEntries` (`organizationId` + `startAt`, `organizationId` + `staffUid` + `startAt`) if queries fail in the console.

## Demo data

Admin calendar → **Seed demo schedule** writes several blocks for the first two staff in the reporting segment list (safe to run multiple times).

## Legacy

- `AdminScheduleDirectoryView` remains in the repo but is no longer mounted on `/admin/schedule`.
