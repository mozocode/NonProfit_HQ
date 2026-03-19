# Deployment notes

## Hosting the Next.js app

This repo is a standard **Next.js 15** app. Common options:

| Platform | Notes |
|----------|--------|
| **Vercel** | Connect Git repo; set `NEXT_PUBLIC_FIREBASE_*` in Project → Environment Variables for Production/Preview. |
| **Firebase App Hosting** | Native Firebase integration; same env vars. |
| **Node server** | `npm run build && npm run start`; inject env at runtime. |

Always set **all** Firebase web config variables for the target project. Never commit `.env.local`.

## Firebase CLI

Install [Firebase CLI](https://firebase.google.com/docs/cli) and login:

```bash
firebase login
firebase use <your-project-id>
```

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
