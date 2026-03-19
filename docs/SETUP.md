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

### First admin (`mozodevelopment@gmail.com` or any email)

The callable **`setOrgUserClaims`** requires an existing **admin** token, so the **first** admin must be bootstrapped with the **Admin SDK** (service account or Application Default Credentials).

1. Create the user in **Firebase Console → Authentication** (email/password) if you have not already.
2. Download a **service account key**: Firebase Console → Project settings → Service accounts → Generate new private key (keep it secret; never commit).
3. From the repo:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
cd functions
npm run bootstrap-admin
```

Defaults: email **`mozodevelopment@gmail.com`**, org **`org_demo`**, org name **NonProfit HQ**. Override with env:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@company.com BOOTSTRAP_ORG_ID=org_demo npm run bootstrap-admin
```

This script:

- Sets **`custom claims`** `{ orgId, role: "admin" }`
- **`merge`**s **`organizations/{orgId}`** (name, status, settings)
- **`merge`**s **`organizationMemberships/{orgId}_{uid}`** (`active: true`, `role: admin`, `programIds: []`)
- **`merge`**s **`profiles/{uid}`** (display name, email, timestamps)

4. **Sign out and sign in again** in the web app (or hard-refresh after token refresh) so the new claims appear on the JWT.

Script source: **`functions/scripts/bootstrapFirstAdmin.cjs`**.

**If bootstrap fails with `Cloud Firestore API has not been used` / `SERVICE_DISABLED`:**

1. Create a Firestore database if you have not: Firebase Console → **Build → Firestore Database** → **Create database** (choose a mode and region). That enables the API for the project.
2. Or enable the API directly: [Enable Cloud Firestore API for `nonprofithq`](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=nonprofithq) → **Enable**.
3. Wait 1–2 minutes, then run `npm run bootstrap-admin` again.

### Additional users (after you have an admin)

Use the callable **`setOrgUserClaims`** from the app (admin-only) or Admin SDK, with Auth user + membership doc as documented in `functions/src/index.ts`.

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
- First admin bootstrap: use **`functions/scripts/bootstrapFirstAdmin.cjs`** (`npm run bootstrap-admin` in `functions/`) with a service account — see **§5 Custom claims** above.

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PHASE23-production-hardening.md](./PHASE23-production-hardening.md)
- [README.md](../README.md)
