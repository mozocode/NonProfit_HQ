# NonProfit HQ

Web application for nonprofit case management: families, goals/tasks, documents, surveys, weekly planning, staff schedule, and admin reporting — backed by **Firebase** (Auth, Firestore, Storage) and optional **Cloud Functions**.

## Architecture summary

| Layer | Stack |
|-------|--------|
| **UI** | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn-style UI components |
| **State** | React hooks, Zustand (`sessionStore`), client-side data fetching |
| **Auth** | Firebase Auth; custom claims `orgId` + `role`; profile + `organizationMemberships` in Firestore |
| **Data** | Firestore (multi-tenant `organizationId`), Storage for family documents |
| **Serverless** | Firebase Cloud Functions (`functions/`) — schedules, callables (`setOrgUserClaims`, export jobs), notification **stubs** |
| **Quality** | TypeScript strict, ESLint, Vitest for pure `lib/` logic (see `npm test`) |

**Tenant model:** Almost all documents include `organizationId`. Security rules enforce `request.auth.token.orgId` and membership + role. See `firestore.rules` and `docs/SETUP.md` (role assumptions).

**Key source areas:**

- `src/app/` — routes (`(dashboard)/admin`, `staff`, `participant`)
- `src/services/firestore/` — Firestore access patterns
- `src/features/` — feature UI (weekly planning, surveys, admin tools, schedule, etc.)
- `src/lib/` — pure utilities (workflow, reporting filters, survey aggregation, retry, weekly oversight)
- `docs/` — phase docs (PHASE\*.md), **SETUP**, **DEPLOYMENT**, **FUTURE-INTEGRATIONS**

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with Firebase Web config from Firebase Console
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

Full local + Firebase + emulator + seed notes: **[docs/SETUP.md](./docs/SETUP.md)**

## Run instructions

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run seed:validate` | Validate seed JSON shape |

**Functions (subproject):**

```bash
cd functions && npm install && npm run build
```

## Deployment notes

Deploy order of operations (typical):

1. Set **environment variables** on your host (all `NEXT_PUBLIC_FIREBASE_*`).
2. Deploy **Firestore indexes** → **rules** → **Storage rules**.
3. Deploy **Cloud Functions** (after `functions` build).
4. Deploy **Next.js** (Vercel, Firebase App Hosting, or Node).

Detailed checklist: **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**

## Admin Command Center

The **admin** landing experience is the **Command Center** (`/admin`):

- **File:** `src/features/admin-dashboard/AdminCommandCenterView.tsx`
- **Behavior:** Segment filters (schools, partners, programs), date range, overview metrics, activity feed, staff oversight table, **Quick links** to schedules, weekly submissions, oversight, reporting, schools, partners, exports, and **Admin tools** (`/admin/tools`).
- **Data:** `useAdminCommandCenter` + `adminCommandCenterService` (Firestore aggregates).

Related admin surfaces (non-exhaustive):

| Area | Route |
|------|--------|
| Admin tools hub | `/admin/tools` |
| Reporting | `/admin/reporting` |
| Weekly submissions | `/admin/weekly-submissions` |
| Weekly oversight | `/admin/weekly-oversight` |
| Staff schedule | `/admin/schedule` |
| Surveys | `/admin/surveys` |

## Documentation index

| Doc | Topic |
|-----|--------|
| [docs/SETUP.md](./docs/SETUP.md) | Local dev, env, Firebase, rules, indexes, emulators, seed, roles |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Hosting, deploy commands, smoke tests |
| [docs/FUTURE-INTEGRATIONS.md](./docs/FUTURE-INTEGRATIONS.md) | BambooHR, Google Calendar, email, mobile, emulators in Next |
| [docs/PHASE2-FIREBASE-AUTH.md](./docs/PHASE2-FIREBASE-AUTH.md) | Auth flow, claims, RoleGate |
| [docs/PHASE3-SEED-STRATEGY.md](./docs/PHASE3-SEED-STRATEGY.md) | Seed order and IDs |
| [docs/PHASE15-CLOUD-FUNCTIONS.md](./docs/PHASE15-CLOUD-FUNCTIONS.md) | Schedules, stubs, indexes |
| [docs/PHASE23-production-hardening.md](./docs/PHASE23-production-hardening.md) | Tests, retry, a11y, QA checklists |

## Technical debt & future enhancements

- **Emulators:** Not connected from Next.js client yet — see [FUTURE-INTEGRATIONS.md](./docs/FUTURE-INTEGRATIONS.md).
- **Server-side auth:** Optional `middleware.ts` / session cookies for SSR protection; today relies on client `AuthProvider` + `RoleGate`.
- **Firestore typing:** Prefer Zod validation at read boundaries in services (see Phase 23 doc).
- **Performance:** Some admin views scan or N+1 — see `docs/PHASE23-production-hardening.md` hotspots.
- **Notifications:** Email/FCM are stubs in Functions — wire before relying on reminders in production.
- **Optimistic UI:** Intentionally limited; risky for compliance-related writes.

## Future roadmap (integrations)

High-level backlog: **BambooHR** (HRIS roster), **Google Calendar** (schedule sync fields reserved), **email provider** (replace function stubs), **mobile app** (Expo + same Firebase). Details: **[docs/FUTURE-INTEGRATIONS.md](./docs/FUTURE-INTEGRATIONS.md)**

## License

Private / org-specific — adjust as needed.

---

**Phase 24 handoff:** `.env.example`, this README, `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `docs/FUTURE-INTEGRATIONS.md`, `.gitignore` fix so `.env.example` is trackable.
