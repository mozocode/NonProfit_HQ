# Deployment notes

## Hosting the Next.js app

This repo is a standard **Next.js 15** app. **Production for project `nonprofithq` uses [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)** (GitHub-connected builds in Google Cloud).

| Platform | Notes |
|----------|--------|
| **Firebase App Hosting** (production) | Connect repo in Console; set `NEXT_PUBLIC_FIREBASE_*` on the App Hosting backend; deploy on push to the linked branch. |
| **Vercel** | Alternative: connect Git repo; set env in Project → Environment Variables. |
| **Node server** | `npm run build && npm run start`; inject env at runtime. |

**Live URLs (same default Hosting site):**

- **Primary:** [https://nonprofithq.firebaseapp.com](https://nonprofithq.firebaseapp.com/)
- **Alternate:** [https://nonprofithq.web.app](https://nonprofithq.web.app/)

**Console:** [Hosting — site `nonprofithq`](https://console.firebase.google.com/project/nonprofithq/hosting/sites/nonprofithq)

Always set **all** Firebase web config variables for the target project. Never commit `.env.local`.

## Firebase CLI

Install [Firebase CLI](https://firebase.google.com/docs/cli) and login:

```bash
firebase login
firebase use <your-project-id>
```

This repo includes **`.firebaserc`** with default project **`nonprofithq`**.

## Firebase App Hosting (recommended — production)

1. In [Firebase Console](https://console.firebase.google.com/project/nonprofithq/hosting) → **App Hosting**, connect this GitHub repository and select the production branch.
2. Configure **environment variables** on the backend (all `NEXT_PUBLIC_FIREBASE_*` from `.env.example` / Firebase Web app config).
3. Merging or pushing to the connected branch triggers **Cloud Build** and rolls out to **`https://nonprofithq.firebaseapp.com`** (and `https://nonprofithq.web.app`).

See [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) for rollouts, secrets, and custom domains.

> **Billing:** App Hosting / SSR typically requires the **Blaze** plan.

## Optional: manual deploy via Firebase CLI (Hosting + web frameworks)

If you need a **CLI-driven** deploy to the same Firebase project (instead of or in addition to App Hosting’s Git pipeline), this repo includes **`hosting`** in `firebase.json` with a **`frameworksBackend`** (Next.js preview integration — builds SSR via Cloud Functions). This is **not** the same as App Hosting’s managed backend but can target the same Hosting URLs.

**One-time on your machine:**

```bash
firebase experiments:enable webframeworks
```

**Before each deploy:** ensure production Firebase web config is available at build time (e.g. `.env.production` or `.env.local` with `NEXT_PUBLIC_FIREBASE_*` for project `nonprofithq`).

```bash
npm run deploy:hosting
# or: firebase deploy --only hosting --project nonprofithq
```

Docs: [Next.js on Firebase Hosting (frameworks)](https://firebase.google.com/docs/hosting/frameworks/nextjs).

### Troubleshooting: 404 on `/` (firebaseapp.com / web.app)

**Symptom:** The Hosting URL loads but every path (including `/`) returns **404**.

**Common cause:** Next.js resolves the App Router from **`app/` at the repo root first**, then falls back to **`src/app`**. An **empty or stub `app/`** folder (no `layout.tsx` / `page.tsx`) makes the production build ship almost no routes—only static fallbacks—so Hosting has nothing to serve for `/`.

**Fix:**

1. **Remove** a stray root-level `app/` directory if your real routes live under **`src/app/`** (this repo’s pages are in `src/app/` only).
2. Run **`npm run build`** locally and confirm the route list includes `/`, `/login`, `/admin`, etc.
3. **Redeploy** (push to the App Hosting–linked branch, or `npm run deploy:hosting` after `firebase experiments:enable webframeworks`).

**Also check:** App Hosting **build logs** in Google Cloud Console for a failed `next build`; a failed build can leave the previous broken version live.

## Firestore indexes

Indexes are declared in **`firestore.indexes.json`**.

```bash
firebase deploy --only firestore:indexes
```

After deploy, wait for indexes to build (Console → Firestore → Indexes). Until **Enabled**, some list queries will fail client-side.

If the app logs a URL to “create index”, you can click it once, or add the equivalent entry to `firestore.indexes.json` and redeploy for reproducibility.

## Firestore Security Rules

Source: **`firestore.rules`**.

Highlights:

- **`organizationMemberships`** doc id pattern `{organizationId}_{uid}` used in `get()` for `isActiveMember`.
- Custom claims **`orgId`** and **`role`** must match document `organizationId` and membership role.
- Per-collection `match` blocks for families, goals, surveys, admin data, etc.

Deploy:

```bash
firebase deploy --only firestore:rules
```

**Pre-production checklist:** Review every `allow read/write` for data exposure; test with each role in the Emulator or staging project.

## Firebase Storage Rules

Source: **`storage.rules`**.

- Primary path: `organizations/{organizationId}/**` — read: signed-in + `token.orgId == organizationId`; write: staff/admin.
- Legacy: `orgs/{orgId}/**` — participant read allowed.

Deploy:

```bash
firebase deploy --only storage
```

Ensure Storage bucket CORS / rules align with browser upload paths used in `storageService.buildFamilyDocumentPath`.

## Cloud Functions

Directory: **`functions/`**

```bash
cd functions
npm ci
npm run build
cd ..
firebase deploy --only functions
```

- **Node 20** per `functions/package.json` `engines`.
- Scheduled jobs and callables: see [PHASE15-CLOUD-FUNCTIONS.md](./PHASE15-CLOUD-FUNCTIONS.md).
- **Secrets:** notification stubs today; add Secret Manager / `firebase functions:secrets:set` when wiring email/FCM.

## Cloud Functions + Firestore together

```bash
firebase deploy --only firestore,functions,storage
```

## Post-deploy smoke test

1. Open hosted URL → login as **admin** (claims + membership correct).
2. Open **Admin** command center and one **staff** flow.
3. Upload a **family document** (Storage rules + Firestore doc path).
4. Trigger a **Firestore query** that needed a composite index (e.g. schedule, reporting).
5. Optional: confirm a **scheduled function** ran (Firebase Console → Functions → Logs).

## Rollback

- **Hosting:** revert deployment in host UI or redeploy previous Git tag.
- **Rules:** keep `firestore.rules` / `storage.rules` in version control; redeploy prior commit.
- **Functions:** redeploy previous `functions` build artifact or Git revision.

## Monitoring

- Enable **Firebase Crashlytics** / **Performance** if you add their SDKs.
- Use **Cloud Logging** for Functions; set alerts on error rate.
- Consider **App Check** for production web to reduce abuse (documented as enhancement in README).
