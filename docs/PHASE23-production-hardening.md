# Phase 23 — Production hardening

## What shipped

### Automated tests (Vitest)

- **Scripts:** `npm test` (CI), `npm run test:watch` (local).
- **Config:** `vitest.config.ts` — Node env, `src/**/*.test.ts`, `@` alias.

| Area | File |
|------|------|
| Workflow utilities | `src/lib/workflowUtils.test.ts` |
| Weekly oversight / comparison logic | `src/lib/weeklyOversightUtils.test.ts` |
| Survey outcome aggregation | `src/lib/surveyAggregation.test.ts` |
| Validators (Zod) | `src/lib/validators.test.ts` — login + intake |
| Reporting date / link filters | `src/lib/reportingFilters.test.ts` |
| Goal task open / due-week logic | `src/lib/goalTaskUtils.test.ts` |
| Retry helpers | `src/lib/retry.test.ts` |

### Refactors for testability

- **`src/lib/reportingFilters.ts`** — `reportingDayStart`, `reportingDayEnd`, `isoTimestampInRange`, `linkActiveInRange` (used by `adminReportingService.ts`).
- **`src/lib/goalTaskUtils.ts`** — `isOpenGoalTaskStatus`, `isDueDateInWeek` (used by `goalsTasksService.listOpenTasksDueInWeekByStaff`).
- **`src/lib/retry.ts`** — `withRetry`, `isLikelyTransientError`.

### Resilience

- **Storage uploads** (`storageService`): `uploadBytes` wrapped with `withRetry` (3 attempts, backoff).
- **Survey report load** (`useSurveyReport`): `Promise.all` for survey + responses wrapped with `withRetry` (2 attempts).

### UI / accessibility

- **`EmptyState`:** `role="region"`, `aria-labelledby` on title, decorative icon `aria-hidden`.
- **`LoadingState`:** status message uses `aria-live="polite"` + `aria-atomic`.
- **Staff admin tool:** `EmptyState` when no active members.

### Optimistic UI (policy)

- **Not added broadly.** Safe candidates later: toggles that revert on failure (e.g. non-destructive filters). **Unsafe without server reconciliation:** create/update Firestore docs, role changes, uploads, financial or compliance data. Document any future optimistic UX with rollback + toast.

---

## QA checklist (manual)

- [ ] Sign-in: invalid email / short password messages (Zod).
- [ ] Intake form: required fields block submit; demographics strict mode rejects junk keys.
- [ ] Staff documents: upload large file on slow network; confirm retry (or failure message after retries).
- [ ] Admin survey report: load with throttling; should retry once on transient failure.
- [ ] Reporting: change date range + segment filters; spot-check counts vs raw Firestore for one family.
- [ ] Weekly oversight: week with mixed submitted/reviewed/draft staff; badges match expectations.
- [ ] Screen reader: empty state and loading message announced where used.
- [ ] Keyboard: tab through staff role selects and save buttons; focus visible.

---

## Production-readiness checklist

### Security

- [ ] **Firestore rules** reviewed for all collections touched by new admin tools and client writes.
- [ ] **Storage rules** path-scoped to `organizations/{orgId}/...`; no cross-tenant reads.
- [ ] **No secrets** in client bundle; Firebase config is public-by-design — enforce rules + App Check (optional).
- [ ] **Custom claims** or membership checks align with `RoleGate` (UI is not authorization).
- [ ] **Audit logging** for sensitive admin actions (server-side append to `auditLogs`).

### Reliability

- [ ] Run **`npm test`** in CI.
- [ ] Run **`npm run build`** before release.
- [ ] **Indexes** deployed (`firebase deploy --only firestore:indexes`) after query changes.
- [ ] **Error monitoring** (e.g. Sentry) for client + optional Functions.

### Performance

- [ ] **N+1 queries:** audit admin views that loop `getDoc` per row; batch or denormalize where hot.
- [ ] **Collection group** queries (`goalTasks`, etc.) — monitor cost; cap limits.
- [ ] **Bundle:** analyze large pages (admin reporting, surveys); dynamic import if needed.
- [ ] **Images / files:** size limits on uploads; virus scan pipeline if policy requires.

### Type coverage

- [ ] `npm run typecheck` in CI (strict mode on).
- [ ] Prefer typing Firestore mappers (`Record<string, unknown>` → domain types) in services.
- [ ] Avoid `as any`; use Zod parse at boundaries for untrusted input.

---

## Type coverage review (summary)

| Layer | Status |
|-------|--------|
| Domain / view types | Strong in `src/types/*` |
| Firestore reads | Often `as` casts — **refactor:** zod `.safeParse` per collection |
| API boundaries | Intake/login use Zod; extend to enrollment/assessment submit payloads |
| Hooks | Generally typed; some `Error \| null` only — fine |

---

## Performance hotspots (candidates)

1. **`adminReportingService`** — multiple `getDocs` + per-doc work; consider parallel batches or pre-aggregated snapshots.
2. **`adminBuildComparisonGrid` / oversight** — per-staff sequential fetches; could parallelize with `Promise.all` + concurrency limit.
3. **`listOpenTasksDueInWeekByStaff`** — full org task scan; optional `where('dueDate', '>=', ...)` if index added.
4. **Survey report** — loads all responses client-side; paginate or aggregate in Cloud Function for huge surveys.

---

## Refactor suggestions (prioritized)

1. **Zod at Firestore boundary** — one schema per collection for `doc.data()` validation in dev/test.
2. **Shared `useAsyncData` hook** — consistent loading/error/retry for list pages (don’t duplicate try/catch).
3. **Extract more pure filters** from services into `lib/*` (same pattern as `reportingFilters`).
4. **Component tests** (RTL + Vitest jsdom) for `EmptyState`, critical forms, and one admin table.
5. **E2E** (Playwright) for sign-in + one staff + one admin path — smoke only.
6. **Firebase App Check** before production if abuse is a concern.

---

## Files created / changed (summary)

**New:** `vitest.config.ts`, `src/lib/reportingFilters.ts`, `src/lib/goalTaskUtils.ts`, `src/lib/retry.ts`, `src/lib/*.test.ts` (7 files), `docs/PHASE23-production-hardening.md`.

**Updated:** `package.json`, `adminReportingService.ts`, `goalsTasksService.ts`, `storageService.ts`, `useSurveys.ts`, `empty-state.tsx`, `loading-state.tsx`, `AdminStaffUsersToolView.tsx`.
