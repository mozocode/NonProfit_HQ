# Phase 2: Firebase setup and auth

## Firebase setup files

| File | Purpose |
|------|--------|
| `src/services/firebase/client.ts` | App init (browser-only), Auth/Firestore/Storage instances; returns `null` during SSR. |
| `src/lib/env.ts` | `getFirebaseClientConfig()`, `validateFirebaseEnv()` for env validation and config. |
| `src/services/auth/authService.ts` | `login`, `logout`, `subscribe`; maps Firebase User to `AuthUser` with token claims (role, orgId). |
| `src/services/firestore/profileService.ts` | `getUserProfile(uid)`, `getOrgMembership(orgId, uid)` for profile and org membership. |
| `src/services/storage/storageService.ts` | `uploadOrgFile`; guards against null Storage (SSR). |

## Provider and hook files

| File | Purpose |
|------|--------|
| `src/providers/AuthProvider.tsx` | Subscribes to Auth; on login fetches profile + membership; shows full-screen loading until `initialized`. |
| `src/hooks/useAuth.ts` | Returns `user`, `profile`, `membership`, `role`, `orgId`, `isAuthenticated`, `isLoading`, `login`, `logout`. |
| `src/store/sessionStore.ts` | Zustand store: `user`, `profile`, `membership`, `initialized` and setters/clear. |

## Auth flow

1. **App load**  
   `AuthProvider` mounts and subscribes to Firebase Auth. Until the first auth event is processed, `initialized` is false and a full-screen loading spinner is shown.

2. **Not signed in**  
   Auth emits null → `clearSession()` (user, profile, membership cleared, `initialized = true`). Root page redirects to `/login`.

3. **Sign in**  
   User submits login form → `authService.login(email, password)` → Firebase Auth signs in.  
   Auth state change → `AuthProvider` receives user → `setSession(user)` (from token: uid, email, displayName, role, orgId) → in parallel:
   - `getUserProfile(uid)` → Firestore `users/{uid}` → `setProfile(profile)`
   - `getOrgMembership(orgId, uid)` → Firestore `orgUsers/{orgId_uid}` → `setMembership(membership)`  
   Then `setInitialized(true)` → loading hides, app renders.

4. **Role and org**  
   `useAuth()` exposes:
   - `role`: `user?.role ?? membership?.role` (token claim or Firestore membership).
   - `orgId`: `user?.orgId ?? membership?.orgId`.

5. **Sign out**  
   `useAuth().logout()` (or AppShell sign-out) → `authService.logout()` → `clearSession()` → `router.replace(ROUTES.LOGIN)`.

## Route protection (App Router)

- **Client components**  
  Wrap dashboard routes with `<RoleGate allow={["admin"]}>` (or `["staff","admin"]`, etc.).  
  If not initialized: render null. If not authenticated: redirect to `ROUTES.LOGIN`. If role not in `allow`: redirect to `ROUTES.UNAUTHORIZED`.

- **Root redirect**  
  `src/app/page.tsx` uses `useAuth()` and redirects by `role` to `/admin`, `/staff`, or `/participant`. Unauthenticated → `/login`.

- **Middleware (optional)**  
  You can add `middleware.ts` at project root to redirect unauthenticated users to `/login` by reading a cookie/session (e.g. Firebase session cookie set via a server action or separate auth flow). Current setup relies on client-side AuthProvider + RoleGate.

- **Server components**  
  For server-rendered checks, use Firebase Admin SDK in API routes or server actions and validate the session token; then redirect or return 403. Client-side AuthProvider remains the source of truth for the SPA.

## Future mobile app (Expo) sharing the same backend

- **Same Firebase project**  
  Use the same Firestore, Auth, and Storage. Mobile app uses its own Firebase config (same project, different app if desired).

- **Same auth model**  
  Firebase Auth (email/password, or add OAuth) with custom claims `role` and `orgId` set by Cloud Function `setOrgUserClaims`. Mobile reads `getIdTokenResult()` and/or fetches `orgUsers` and `users` like the web app.

- **Same data and rules**  
  Firestore/Storage security rules key off `request.auth.token.orgId` and `request.auth.token.role`. No change for mobile.

- **Shared logic**  
  Reuse in a shared package or copy:
  - Firestore collection names and document shapes (`users`, `orgUsers`, etc.).
  - Auth flow: sign in → read token claims → fetch `getUserProfile(uid)` and `getOrgMembership(orgId, uid)`.
  - Role-based redirects (e.g. admin → admin stack, staff → staff stack, participant → participant stack).

- **Mobile-specific**  
  Expo app uses its own AuthProvider/useAuth that subscribes to Firebase Auth and calls the same profile/membership helpers, with navigation (e.g. Expo Router) instead of Next.js router.

## Files created or changed (Phase 2)

**Created**

- `src/services/firestore/profileService.ts` – user profile and org membership fetch.
- `src/providers/AuthProvider.tsx` – auth bootstrap, loading, profile/membership fetch.
- `src/hooks/useAuth.ts` – auth state and login/logout.
- `docs/PHASE2-FIREBASE-AUTH.md` – this file.

**Changed**

- `src/lib/env.ts` – `validateFirebaseEnv()`, `FirebaseClientConfig` export.
- `src/services/firebase/client.ts` – browser-only init, nullable exports for SSR.
- `src/services/auth/authService.ts` – `guardAuth()`, null-safe subscribe.
- `src/services/storage/storageService.ts` – `guardStorage()`.
- `src/types/auth.ts` – `UserProfile`, `OrgMembership`, session `profile`/`membership`.
- `src/store/sessionStore.ts` – `profile`, `membership`, `setProfile`, `setMembership`; `clearSession` clears them.
- `src/providers/AppProviders.tsx` – uses `AuthProvider` instead of `AuthBootstrap`.
- `src/features/auth/LoginForm.tsx` – login then redirect; no manual session set.
- `src/components/auth/RoleGate.tsx` – uses `useAuth`, `ROUTES`, redirect to unauthorized when role not allowed.
- `src/components/layout/AppShell.tsx` – uses `useAuth()` for orgId and logout.
- `src/app/page.tsx` – uses `useAuth()` and `ROUTES` for role-based redirect.

**Removed**

- `src/providers/AuthBootstrap.tsx` – replaced by `AuthProvider`.
