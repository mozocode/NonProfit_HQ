# Local setup guide

## Prerequisites

- **Node.js** 20+ (aligns with Cloud Functions `engines.node` in `functions/package.json`).
- **npm** (or pnpm/yarn if you adapt lockfiles).
- A **Firebase project** (Blaze plan recommended if you use Cloud Functions beyond free tier).

## 1. Clone and install

```bash
cd NonProfit_HQ
npm install
cd functions && npm install && cd ..
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set all `NEXT_PUBLIC_FIREBASE_*` variables from:

**Firebase Console → Project settings → General → Your apps → Web app**

Without these, the app initializes Firebase as `null` in the browser and auth/data features will not work (see `src/lib/env.ts`).

> **Note:** `.env.local` is gitignored. Only `.env.example` is committed.

## 3. Run the Next.js app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/login`.

Other scripts:

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest unit tests |

## 4. Firebase project setup (high level)

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** → Sign-in method → **Email/Password** (or add providers you need).
3. Create a **Firestore** database (production mode, then deploy rules from repo).
4. Enable **Storage** and deploy `storage.rules` from repo.
5. Register a **Web app** and copy config into `.env.local`.
6. For **production** Next.js deploys, use **[Firebase App Hosting](https://firebase.google.com/docs/app-hosting)** (GitHub-linked). The default public URL for project `nonprofithq` is **[https://nonprofithq.firebaseapp.com](https://nonprofithq.firebaseapp.com/)** (see [Hosting console](https://console.firebase.google.com/project/nonprofithq/hosting/sites/nonprofithq)).

Detailed deploy steps: [DEPLOYMENT.md](./DEPLOYMENT.md).

## 5. Custom claims (required for Firestore / Storage rules)

Security rules expect JWT custom claims:

- `orgId` — tenant organization id  
- `role` — `admin` | `staff` | `participant`

Set these via the callable Cloud Function **`setOrgUserClaims`** (see `functions/src/index.ts`) after:

1. User exists in **Firebase Auth**.
2. Document exists in **`organizationMemberships`** with matching `organizationId`, `uid`, `active: true`, and `role`.

See [PHASE2-FIREBASE-AUTH.md](./PHASE2-FIREBASE-AUTH.md) and role notes below.

## 6. Firestore indexes

Composite indexes are defined in **`firestore.indexes.json`**. If a query fails in the browser console with a link to create an index, deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

See [DEPLOYMENT.md](./DEPLOYMENT.md#firestore-indexes) for more.

## 7. Firebase Security Rules

- **Firestore:** `firestore.rules` — tenant + role helpers (`orgId`, `role`, membership doc).
- **Storage:** `storage.rules` — paths under `organizations/{organizationId}/...` and legacy `orgs/{orgId}/...`.

Deploy:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Never rely on client-side `RoleGate` alone; rules must enforce access.

## 8. Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

See [PHASE15-CLOUD-FUNCTIONS.md](./PHASE15-CLOUD-FUNCTIONS.md) for schedules, stubs, and indexes.

## 9. Local Firebase emulators

`firebase.json` defines emulators (Auth 9099, Firestore 8080, Functions 5001, Storage 9199, UI 4000).

```bash
firebase emulators:start
```

**Important:** The Next.js app does **not** yet call `connectFirestoreEmulator` / `connectAuthEmulator` in `src/services/firebase/client.ts`. To use emulators from the web app, add that wiring behind an env flag (documented as future work in [FUTURE-INTEGRATIONS.md](./FUTURE-INTEGRATIONS.md)).

You can still use emulators for Functions-only development or Admin SDK scripts pointed at `FIRESTORE_EMULATOR_HOST`.

## 10. Seed / dev fixtures

- Strategy: [PHASE3-SEED-STRATEGY.md](./PHASE3-SEED-STRATEGY.md)
- Sample JSON: `scripts/seed/devSeed.json`
- Validator: `npm run seed:validate`
- Phase 3 seed README: `scripts/seed/phase3/README.md`

Use **Firebase Admin SDK** scripts with a service account or emulator host; do not commit service account keys.

## 11. Role assumptions

| Role | Typical access |
|------|----------------|
| **admin** | `/admin/*`, command center, tools, reporting, schedule oversight, memberships (where UI allows) |
| **staff** | `/staff/*`, families, tasks, agenda, report, schedule |
| **participant** | `/participant/*`, limited surveys/resources |

- **Firestore rules** use `request.auth.token.orgId` and `request.auth.token.role` plus **`organizationMemberships/{orgId}_{uid}`** for `active` membership.
- **UI** uses `RoleGate` — not a security boundary.
- First admin bootstrap: create org + membership in Firestore, create Auth user, run **`setOrgUserClaims`** with Admin SDK or callable (authenticated as admin — chicken-and-egg: often first claims set via Admin SDK script).

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PHASE23-production-hardening.md](./PHASE23-production-hardening.md)
- [README.md](../README.md)
