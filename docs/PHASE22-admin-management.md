# Phase 22 — Admin management tools

## Hub

- **`/admin/tools`** — navigation hub, multi-org onboarding checklist, links to configure + review areas.
- Quick link from **Command center** and **Admin quick links** (`ROUTES.ADMIN_TOOLS`).

## Tool routes

| Route | Purpose |
|-------|---------|
| `/admin/tools/staff` | List active members; change **role** (admin/staff/participant); **deactivate** membership |
| `/admin/tools/resources` | **Categories** + **resources** CRUD (directory listings) |
| `/admin/tools/document-templates` | **Required document templates** CRUD |
| `/admin/tools/workflows` | **Workflow stage template** in `organizations.settings.workflowStages` |
| `/admin/tools/audit-logs` | Read **auditLogs** (org-scoped, newest first) |
| `/admin/tools/organization` | **Organization** name/status; read-only **settings** JSON; onboarding copy |

## Already-existing admin surfaces (linked from hub)

| Area | Route |
|------|--------|
| Surveys | `/admin/surveys` |
| Schools | `/admin/schools` |
| Partners | `/admin/partners` |
| Weekly agendas & reports | `/admin/weekly-submissions` |
| Weekly oversight | `/admin/weekly-oversight` |
| Staff schedule | `/admin/schedule` |
| Reporting | `/admin/reporting` |

## Service layer (mutations)

| Service | Functions |
|---------|-----------|
| `organizationService.ts` | `getOrganization`, `adminUpdateOrganization`, `getOrgWorkflowStages`, `saveOrgWorkflowStages`, `defaultWorkflowStagesFromConstants` |
| `adminMembershipService.ts` | `listOrganizationMembers`, `adminSetMemberRole`, `adminSetMemberActive` |
| `auditLogService.ts` | `listAuditLogsForOrganization` |
| `resourcesService.ts` | `adminCreateResourceCategory`, `adminCreateResource`, `adminUpdateResource`, `adminUpdateResourceCategory` |
| `documentsService.ts` | `adminCreateRequiredTemplate`, `adminUpdateRequiredTemplate` |

## Hooks

- `src/hooks/useAdminTools.ts` — `useAdminOrganizationMembers`, `useAdminAuditLogs`, `useAdminOrganizationRecord`, `useAdminResourceDirectoryManage`, `useAdminDocumentTemplatesManage`, `useOrgWorkflowStagesAdmin`

## Multi-organization onboarding

- `src/lib/multiOrgOnboarding.ts` — `MULTI_ORG_ONBOARDING_STEPS`, `describeTenantIsolation()`.
- App session remains **single org** via `AuthProvider` / `orgId`; future work: org switcher + membership query.

## Permissions & security (important)

1. **Firestore rules** must restrict writes to `organizations`, `organizationMemberships`, `resources`, `resourceCategories`, `requiredDocumentTemplates`, and `auditLogs` to **admins** (or Cloud Functions). Client-side `RoleGate` is not sufficient alone.
2. **Last admin**: `adminSetMemberRole` blocks demoting the last active admin. `adminSetMemberActive` blocks deactivating the last admin or self-deactivation.
3. **Invites**: Creating Firebase users and initial membership documents is **out of scope** for these pages; use Admin SDK / Callable functions / console.
4. **Audit logs**: This phase is **read-only**; append audit rows from trusted server-side code when mutating sensitive data.

## Indexes

- Added composite index: **`organizationMemberships`** — `organizationId` + `uid` (for membership lookup by user).

Deploy with `firebase deploy --only firestore:indexes` if queries prompt for an index.

## Files created / changed (summary)

**New:** `src/types/adminManagement.ts`, `src/services/firestore/organizationService.ts`, `src/services/firestore/adminMembershipService.ts`, `src/services/firestore/auditLogService.ts`, `src/hooks/useAdminTools.ts`, `src/lib/multiOrgOnboarding.ts`, `src/features/admin-tools/*`, `src/app/(dashboard)/admin/tools/**`, `docs/PHASE22-admin-management.md`.

**Updated:** `src/constants/index.ts` (routes), `src/services/firestore/resourcesService.ts`, `src/services/firestore/documentsService.ts`, `firestore.indexes.json`, `AdminCommandCenterView.tsx`, `AdminQuickLinks.tsx`.
