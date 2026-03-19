# Phase 1: Web application scaffold

## File tree

```
NonProfit_HQ/
├── app/                          # Next.js App Router (under src/app)
│   └── (see src/app below)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # optional
│   │   │   ├── loading.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── sign-in/
│   │   │       └── page.tsx
│   │   └── (dashboard)/
│   │       ├── loading.tsx
│   │       ├── admin/
│   │       │   └── page.tsx
│   │       ├── staff/
│   │       │   └── page.tsx
│   │       └── participant/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   └── page-spinner.tsx
│   │   ├── auth/
│   │   │   └── RoleGate.tsx
│   │   └── layout/
│   │       └── AppShell.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── loginSchema.ts
│   │   ├── dashboard/
│   │   │   ├── AdminDashboardView.tsx
│   │   │   ├── StaffDashboardView.tsx
│   │   │   └── ParticipantDashboardView.tsx
│   │   └── families/
│   │       └── index.ts
│   ├── services/
│   │   ├── firebase/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   ├── firestore/
│   │   │   └── collections.ts
│   │   └── storage/
│   │       └── storageService.ts
│   ├── hooks/
│   │   └── useCurrentSession.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── index.ts
│   ├── store/
│   │   └── sessionStore.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── env.ts
│   │   └── roles.ts
│   ├── providers/
│   │   ├── AppProviders.tsx
│   │   ├── AuthBootstrap.tsx
│   │   └── ThemeProvider.tsx
│   ├── utils/
│   │   └── index.ts
│   ├── constants/
│   │   └── index.ts
│   └── server/
│       └── index.ts
├── functions/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   └── seed/
│       ├── devSeed.json
│       └── validateSeed.ts
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── .prettierignore
├── components.json
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.js
├── storage.rules
├── tailwind.config.ts
└── tsconfig.json
```

## Install commands

From project root:

```bash
# Install app dependencies
npm install

# Install Firebase Cloud Functions dependencies (optional, for backend)
cd functions && npm install && cd ..
```

One-time setup:

```bash
# Copy env template and fill in Firebase config
cp .env.example .env.local
```

## Config files

| File | Purpose |
|------|--------|
| `package.json` | Scripts (dev, build, start, lint, typecheck, format), deps (Next, React Query, Tailwind, Firebase, Zustand, RHF, Zod, shadcn deps) |
| `tsconfig.json` | Strict TS, path alias `@/*` → `src/*`, Next plugin |
| `next.config.ts` | Next.js App Router, reactStrictMode |
| `tailwind.config.ts` | Tailwind content paths, theme (shadcn CSS vars), darkMode: class |
| `postcss.config.js` | tailwindcss, autoprefixer |
| `components.json` | shadcn/ui (new-york, RSC, Tailwind, `@/components`, `@/lib/utils`) |
| `.eslintrc.json` | next/core-web-vitals, next/typescript, prettier |
| `.prettierrc` | semi, double quote, trailing comma, printWidth 100, prettier-plugin-tailwindcss |
| `.prettierignore` | node_modules, .next, dist, etc. |
| `.env.example` | `NEXT_PUBLIC_FIREBASE_*` template for env handling |
| `firebase.json` | functions, firestore rules/indexes, storage rules, emulators |
| `firestore.rules` | Tenant + role security rules |
| `storage.rules` | Path/org-scoped storage rules |
| `firestore.indexes.json` | Composite indexes for queries |
| `functions/tsconfig.json` | Functions TypeScript (ES2022, NodeNext) |

## Path aliases and environment variables

- **Path alias:** `@/*` → `src/*` (used in imports, e.g. `@/components/ui/button`).
- **Env:** Use `NEXT_PUBLIC_*` for client-safe vars. Load in `src/lib/env.ts`. Example: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

## Root providers

- **Auth/session:** `AuthBootstrap` subscribes to Firebase Auth and syncs user + claims into Zustand `sessionStore`.
- **React Query:** `QueryClientProvider` in `AppProviders` with default retry and staleTime.
- **Theme:** `ThemeProvider` in `AppProviders` (no-op for now; extend for dark mode via next-themes or custom state).

## Placeholder pages and loading states

| Route | Description |
|-------|-------------|
| `/` | Home; redirects by role to admin/staff/participant or to login |
| `/sign-in` | Redirects to `/login` |
| `/login` | Sign-in form (placeholder) |
| `/admin` | Admin dashboard (role-gated) |
| `/staff` | Staff dashboard (role-gated) |
| `/participant` | Participant dashboard (role-gated) |
| `/unauthorized` | Access denied message and links to sign-in / home |
| `loading.tsx` (root) | Root loading UI |
| `(auth)/loading.tsx` | Auth group loading |
| `(dashboard)/loading.tsx` | Dashboard group loading |

## All created/updated files (Phase 1)

**New in this phase:**

- `src/utils/index.ts`
- `src/constants/index.ts`
- `src/server/index.ts`
- `src/app/unauthorized/page.tsx`
- `src/app/loading.tsx`
- `src/app/(auth)/loading.tsx`
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(dashboard)/loading.tsx`
- `src/components/ui/page-spinner.tsx`
- `src/providers/ThemeProvider.tsx`
- `docs/PHASE1-SCAFFOLD.md`

**Updated:**

- `src/providers/AppProviders.tsx` (wraps with ThemeProvider)

**Existing scaffold (unchanged):**

- All other files listed in the file tree above.
