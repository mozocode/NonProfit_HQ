# Phase 3: Seed / dev fixture strategy

## Goals

- One organization with admin, staff, and participant memberships.
- Minimal but consistent data across all Phase 3 collections for local/emulator testing and reporting demos.
- Idempotent scripts: run repeatedly without duplicating data (use fixed doc IDs and set/merge).

## Tooling

- **Firebase Admin SDK** in a Node/TypeScript script (or in Cloud Functions one-off) to write to Firestore.
- Run against **emulators** or a **dev project**: set `GOOGLE_APPLICATION_CREDENTIALS` or use `FIRESTORE_EMULATOR_HOST` for local.

## Order of writes

Respect references so that parent docs exist before children:

1. **organizations** (1 doc)
2. **organizationMemberships** (e.g. 3: admin, staff, participant)
3. **profiles** (1 per membership uid)
4. **schools**, **partnerOrganizations** (1 each)
5. **families** (2–3)
6. **familyMembers** (2–4 total)
7. **participantProfiles** (1 if a member is participant)
8. **familySchoolLinks**, **familyPartnerLinks** (link 1 family to school, 1 to partner)
9. **intakes**, **assessments** (1 per family)
10. **staffAssignments** (1–2)
11. **interactions**, **notes** (1–2 each)
12. **resourceCategories**, **resources** (1–2 categories, 2–3 resources)
13. **familyResourceAssignments**, **referrals** (1–2 each)
14. **requiredDocumentTemplates**, **familyDocumentRequirements**, **familyDocuments** (1 each)
15. **reminders**, **staffActionPrompts** (optional; 1 each)
16. **surveys** → **surveyQuestions** (subcollection) (1 survey, 2–3 questions)
17. **surveyResponses** (1)
18. **outcomeMetrics**, **outcomeSnapshots** (1 each)
19. **staffWeeklyAgendas**, **staffWeeklyReports** → **staffReportItems** (1 report with 1–2 items)
20. **staffScheduleEntries**, **staffTimesheetSummaries** (1 each)
21. **organizationMetricsSnapshots** (1 for current period)
22. **auditLogs** (3–5 entries)

Subcollections: **families/{id}/goals** (1 goal), **families/{id}/goals/{goalId}/goalTasks** (1–2 tasks).

## Document ID strategy

- **organizations**: `org_demo` (or env `SEED_ORG_ID`)
- **organizationMemberships**: `{organizationId}_{uid}` (e.g. `org_demo_uid_admin`)
- **profiles**: same as Firebase Auth `uid`
- **families**: `family_1`, `family_2`
- **familyMembers**: `member_1`, `member_2`
- All others: deterministic IDs (e.g. `intake_1`, `assessment_1`, `referral_1`) so re-runs don’t create duplicates when using set with merge.

## Field conventions

- **organizationId** on every tenant-scoped document (no `orgId` for new data).
- **createdAt** / **updatedAt**: Firestore `FieldValue.serverTimestamp()` or ISO strings in seed JSON.
- **createdBy**: uid of the seed “staff” user.

## Example script layout

```ts
// scripts/seed/runPhase3Seed.ts (outline)
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) initializeApp({ projectId: process.env.GCLOUD_PROJECT });

const db = getFirestore();

async function seed() {
  const orgId = "org_demo";
  const adminUid = "seed_admin_uid";
  const staffUid = "seed_staff_uid";
  const participantUid = "seed_participant_uid";

  await db.collection("organizations").doc(orgId).set({ ... }, { merge: true });
  await db.collection("organizationMemberships").doc(`${orgId}_${adminUid}`).set({ ... }, { merge: true });
  // ... rest in order
}
```

## Validation

- Reuse **TypeScript domain types** from `src/types/domain.ts` so seed payloads are typed.
- Optional: run Zod (or similar) schemas against seed objects before writing.
- After seed, run a small reporting query (e.g. families count, referrals count) to confirm indexes and rules.

## Files

- **docs/PHASE3-SEED-STRATEGY.md** (this file): order, IDs, conventions.
- **scripts/seed/phase3/** (optional): JSON or TS seed data per domain (e.g. `organizations.json`, `families.json`) for use by `runPhase3Seed.ts`.
- **scripts/seed/validateSeed.ts**: existing; extend or add `validatePhase3Seed` to validate new collections.
