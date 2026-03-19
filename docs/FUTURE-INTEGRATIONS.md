# Future integrations & roadmap

Planned or likely extensions beyond the current codebase. None of these are production-required for v1; treat as a product/engineering backlog.

## BambooHR (or other HRIS)

**Use cases:** Sync employee roster, job titles, departments; auto-provision/deprovision Firebase users or `organizationMemberships`.

**Approach:**

- Scheduled **Cloud Function** or middle-tier worker with API keys in **Secret Manager**.
- Map HR employee id → `profiles` / `organizationMemberships`; call **`setOrgUserClaims`** after membership writes.
- Conflict policy: HRIS is source of truth vs manual Firestore edits — document for admins.

## Google Calendar

**Use cases:** Two-way or one-way sync for **`staffScheduleEntries`** (Phase 20 reserved `syncSource` / `externalCalendarEventId`).

**Approach:**

- **OAuth 2.0** per staff or service account (Workspace) with stored refresh tokens (encrypted / Secret Manager).
- Cloud Function on a schedule or webhook to pull/push deltas; idempotent upsert by `externalCalendarEventId`.
- Rate limits and timezone handling (app already uses local intent for schedule dates).

## Email provider

**Use cases:** Transactional mail (invites, password reset branding if moving off default Firebase templates), reminder digests, survey invitations.

**Approach:**

- Replace stubs in **`functions/src/notifications.ts`** (see Phase 15) with SendGrid, Postmark, SES, or Firebase “Trigger Email” extension.
- Templates stored in provider or Firestore `emailTemplates` with versioning.
- Unsubscribe / consent for marketing vs transactional (legal review).

## Mobile app (Expo / native)

**Use cases:** Field staff and participants on iOS/Android against the **same** Firebase project.

**Approach:**

- Same **Auth**, **Firestore**, **Storage**; rules already use token claims.
- Shared package or monorepo for: collection names, types, validation Zod schemas.
- Expo Router + Firebase JS SDK or React Native Firebase; push via **FCM**.
- Deep links to family/task routes mirroring `ROUTES.STAFF_*` patterns.

## Emulator wiring in Next.js (dev ergonomics)

**Gap:** `firebase.json` defines emulators, but **`src/services/firebase/client.ts`** does not connect to them.

**Approach:** When `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, call `connectFirestoreEmulator`, `connectAuthEmulator`, `connectStorageEmulator` after `initializeApp` (browser only).

## Multi-organization UI

**Gap:** Session assumes one `orgId` from claims; no org switcher.

**Approach:** Query all `organizationMemberships` for `uid`, let user pick org, call **`setOrgUserClaims`** with new `orgId` (and role for that org) — requires secure callable + possibly refresh token handling.

## Analytics & CRM

- BigQuery export for Firestore (Firebase extension).
- Salesforce / HubSpot sync for funders — usually async pipelines, not in hot path.

---

See also [README.md](../README.md) “Technical debt & future enhancements” for in-repo refactors (tests, Zod at boundary, performance).
