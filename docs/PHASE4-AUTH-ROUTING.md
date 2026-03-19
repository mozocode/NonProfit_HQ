# Phase 4: Authentication and role-aware routing

## Routes

| Path | Purpose | Protection |
|------|---------|------------|
| `/` | Home; redirects to login or role dashboard | Client redirect by role |
| `/login` | Sign-in form | Auth layout: redirect to `/` if already signed in |
| `/sign-in` | Redirects to `/login` | — |
| `/forgot-password` | Placeholder reset flow | None (public) |
| `/unauthorized` | Access denied message | Public |
| `/admin` | Admin Command Center | Dashboard layout + RoleGate `allow={["admin"]}` |
| `/staff` | Staff dashboard | Dashboard layout + RoleGate `allow={["staff", "admin"]}` |
| `/participant` | Participant dashboard | Dashboard layout + RoleGate `allow={["participant"]}` |

## Auth guard components and patterns

### 1. **AuthProvider** (root)

- **Where:** `src/providers/AuthProvider.tsx`; wraps the app in `AppProviders`.
- **Role:** Subscribes to Firebase Auth, loads profile and org membership, and sets session in Zustand. While `!initialized`, renders a **full-screen loading state** (spinner) so no protected or auth UI is shown until profile/membership are resolved.
- **Effect:** Single place for “loading while profile/membership is being resolved” at app bootstrap.

### 2. **AuthGuard** (dashboard layout)

- **Where:** `src/components/auth/AuthGuard.tsx`; used in `src/app/(dashboard)/layout.tsx`.
- **Role:** Ensures the user is signed in before rendering any dashboard child. If not initialized, shows a loading spinner; if initialized and not authenticated, redirects to `/login`.
- **Effect:** All routes under `(dashboard)` (e.g. `/admin`, `/staff`, `/participant`) are **protected**: unauthenticated users never see dashboard content.

### 3. **RoleGate** (per-route role check)

- **Where:** `src/components/auth/RoleGate.tsx`; used in each of `admin/page.tsx`, `staff/page.tsx`, `participant/page.tsx`.
- **Role:** After AuthGuard has already ensured the user is signed in, RoleGate checks that the current role is in the `allow` list. If not, redirects to `/unauthorized`; if not authenticated, redirects to `/login`.
- **Effect:** Prevents access to routes outside the user’s role (e.g. participant cannot access `/admin` or `/staff`).

### 4. **Auth layout** (auth group)

- **Where:** `src/app/(auth)/layout.tsx`.
- **Role:** If the user is already authenticated, redirects to `/` (home) and renders nothing. Used for `/login` and other auth pages so signed-in users don’t see the sign-in form.
- **Effect:** Clean separation of “auth” vs “app” and avoids showing login when already logged in.

## Navigation flow

1. **User opens app (e.g. `/`)**
   - Root layout renders → AuthProvider runs.
   - AuthProvider: if Firebase user exists, fetches profile and membership, then sets `initialized = true`. Until then, it shows the full-screen loading spinner.
   - Once initialized, root page (`/`) runs: if not authenticated → redirect to `/login`; if authenticated → redirect by role to `/admin`, `/staff`, or `/participant`.

2. **User opens `/login`**
   - Auth layout runs. If already authenticated → redirect to `/`.
   - Otherwise, login page and `LoginForm` are shown. On successful sign-in, form calls `authService.login()` then `router.replace("/")`. Home then redirects to the correct dashboard by role.

3. **User opens `/admin` (or `/staff`, `/participant`)**
   - Dashboard layout runs → AuthGuard runs. If not initialized → loading spinner; if not authenticated → redirect to `/login`.
   - If authenticated, the requested dashboard page (e.g. admin) runs → RoleGate runs. If role not in `allow` → redirect to `/unauthorized`; otherwise render dashboard (e.g. AppShell + AdminDashboardView).

4. **User signs out**
   - AppShell (or any UI) calls `useAuth().logout()` → `authService.logout()`, session cleared, then `router.replace(ROUTES.LOGIN)`.

## Where route protection is handled (hybrid)

| Layer | Mechanism | What it does |
|-------|-----------|--------------|
| **Middleware** | Not used | Firebase Auth is client-based; no session cookie is set for server middleware to read. Protection is done in layout/page components. |
| **Layout guards** | Client components in layouts | **Auth layout:** redirects authenticated users away from `/login` (and auth group). **Dashboard layout:** `AuthGuard` ensures only authenticated users see dashboard routes and shows loading until auth is resolved. |
| **Server checks** | Not used | No server-side Firebase Auth in this setup; all auth state is client-side (Zustand + Firebase client SDK). |
| **Client checks** | `useAuth()` + redirects | **Home page:** client effect redirects by auth and role. **RoleGate:** client component on each dashboard page enforces role. **Auth layout:** client effect redirects if authenticated. |

**Summary:** Route protection is a **hybrid of layout guards and client checks**: layout-level `AuthGuard` for “must be signed in” and page-level `RoleGate` for “must have this role.” There is no middleware or server-side auth check; loading state while profile/membership resolve is handled by AuthProvider (full app) and AuthGuard (dashboard).

## Loading states

- **App bootstrap (profile/membership resolving):** AuthProvider shows a full-screen `PageSpinner` until `initialized` is true.
- **Dashboard while checking auth:** AuthGuard shows a centered `PageSpinner` until `isInitialized` and then either redirects (if not authenticated) or renders children.
- **Route-level loading (Next.js):** `loading.tsx` in `(dashboard)` and `(auth)` show `PageSpinner` while the route segment is loading (e.g. suspense).

## Files created or changed

### Created

- `src/app/(auth)/forgot-password/page.tsx` — Forgot-password placeholder with “Back to sign in”.
- `src/app/(dashboard)/layout.tsx` — Protected layout that wraps dashboard routes with `AuthGuard`.
- `src/components/auth/AuthGuard.tsx` — Client guard: redirects unauthenticated users to login, shows loading until auth is resolved.
- `docs/PHASE4-AUTH-ROUTING.md` — This document.

### Changed

- `src/constants/index.ts` — Added `ROUTES.FORGOT_PASSWORD`.
- `src/features/auth/LoginForm.tsx` — Added “Forgot password?” link to `/forgot-password`.
- `src/app/(auth)/layout.tsx` — New auth group layout: redirects authenticated users to `/`.
- `src/app/(dashboard)/participant/page.tsx` — RoleGate restricted to `allow={["participant"]}` (no staff/admin).

### Unchanged (already in place)

- `src/app/page.tsx` — Home: redirect by auth and role.
- `src/app/(auth)/login/page.tsx` — Login page with `LoginForm`.
- `src/app/(auth)/sign-in/page.tsx` — Redirect to `/login`.
- `src/app/unauthorized/page.tsx` — Unauthorized message and links.
- `src/app/(dashboard)/admin/page.tsx` — Admin dashboard with RoleGate `["admin"]`.
- `src/app/(dashboard)/staff/page.tsx` — Staff dashboard with RoleGate `["staff", "admin"]`.
- `src/app/(auth)/loading.tsx`, `src/app/(dashboard)/loading.tsx`, `src/app/loading.tsx` — Loading spinners.
- `src/components/auth/RoleGate.tsx` — Role-based access.
- `src/providers/AuthProvider.tsx` — Bootstrap and full-screen loading until profile/membership resolved.
