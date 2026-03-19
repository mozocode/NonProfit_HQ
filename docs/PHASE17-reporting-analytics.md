# Phase 17 — Reporting & analytics

## What was added

- **Types:** `src/types/reporting.ts` — date range, segment filters, `AdminReportingSnapshot`, export cards, narrative shape. `EMPTY_REPORTING_SEGMENTS` for org-wide queries.
- **Aggregation service:** `src/services/firestore/adminReportingService.ts` — `fetchSegmentFilterOptions`, `fetchAdminReportingSnapshot` (families/members, tasks, documents, referrals, assignments, surveys, outcomes, staff compliance, school/partner breakdowns).
- **Narrative & exports:** `src/lib/reportingNarrative.ts` — `generateReportingNarrative`, `buildReportingExportCards`.
- **Hooks:** `src/hooks/useAdminReporting.ts` — `useReportingFilterOptions`, `useAdminReporting`, `defaultReportingDateRange`.
- **UI:**  
  - `src/features/reporting/AdminReportingView.tsx` — full reporting page (filters, summary cards, plain-language section, simple bar “charts”, tables, export cards).  
  - `src/features/reporting/AdminReportingSummaryStrip.tsx` — command center strip (last 30 days).  
  - `src/features/reporting/SimpleBarChart.tsx`, `ReportingExportCards.tsx`.
- **Route:** `src/app/(dashboard)/admin/reporting/page.tsx`, `ROUTES.ADMIN_REPORTING` in `src/constants/index.ts`.
- **Admin dashboard:** `AdminDashboardView.tsx` links to reporting and embeds `AdminReportingSummaryStrip` (now a client component).

## Chart strategy

No charting library: **CSS/Tailwind horizontal bars** via `SimpleBarChart` (same approach as survey reporting). Tables supplement bars for grant-ready detail.

## Firestore / indexes

Heavy use of `where("organizationId", "==", …)` plus client-side date filtering. Referrals and assignments are filtered by `referredAt` / `assignedAt` in range. If any query fails at runtime, add the composite index suggested in the Firebase console.

Existing `outcomeSnapshots` index includes `organizationId` + `periodStart`; if queries fail, deploy indexes from `firestore.indexes.json`.

## Files touched (summary)

| Area | Files |
|------|--------|
| Types | `src/types/reporting.ts` |
| Service | `src/services/firestore/adminReportingService.ts` |
| Lib | `src/lib/reportingNarrative.ts` |
| Hooks | `src/hooks/useAdminReporting.ts` |
| Features | `src/features/reporting/*`, `src/features/dashboard/AdminDashboardView.tsx` |
| App | `src/app/(dashboard)/admin/reporting/page.tsx` |
| Constants | `src/constants/index.ts` |
