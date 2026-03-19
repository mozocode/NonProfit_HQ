# Phase 12: Resource directory and referral workflow

## Overview

Resource directory with provider photo, name, business name, category, phone, website, notes. Staff can search/filter, assign resources to a family, and track referral status (suggested → referred → connected → in progress → completed). Family profile shows assigned resources and status; participant sees only assigned resources. Structure is ready for admin management later.

## Resource directory fields

- **Provider photo** – `providerPhotoUrl`
- **Provider name** – `providerName`
- **Business name** – `businessName`
- **Category** – `categoryId` / category name from resourceCategories
- **Phone** – `phone`
- **Website** – `website`
- **Notes** – `notes`
- Plus existing: `name`, `description`, `contactInfo`

## Referral status

- **suggested** – Resource suggested to family
- **referred** – Referral made
- **connected** – Family connected with provider
- **in_progress** – In progress
- **completed** – Completed

## Data model

- **Resource** (domain): added `providerPhotoUrl`, `providerName`, `businessName`, `phone`, `website`, `notes`.
- **FamilyResourceAssignment**: added `assignmentId`, `memberId`, `referralStatus` (ReferralStatus). One record per family–resource (and optional member); status is updated by staff.

## Service (`src/services/firestore/resourcesService.ts`)

- **getCategories(organizationId)** – List categories (sortOrder).
- **getResources(organizationId, filters?)** – List resources; optional `categoryId`, `search` (client-side filter by name/provider/business/category).
- **getResource(organizationId, resourceId)** – Single resource.
- **getAssignmentsByFamily(organizationId, familyId)** – Assigned resources with full resource view and referral status.
- **getAssignedResourcesForFamily** – Alias for participants (same as getAssignmentsByFamily).
- **assignResourceToFamily(organizationId, familyId, resourceId, assignedBy, options?)** – Creates assignment with `memberId?`, `initialStatus?` (default "suggested").
- **updateAssignmentStatus(organizationId, assignmentId, referralStatus)** – Update referral status.

## Permissions

- **Staff:** Full directory (getResources), assign and update status. Family profile Resources tab uses staff context.
- **Participant:** Use `getAssignedResourcesForFamily(orgId, familyId)` so they only see assigned resources. Participant UI can call the same service with the participant’s familyId and show only that list.

## UI

- **Resource directory page** (`/staff/resources`) – Search (name/business/category), category filter, grid of ResourceDirectoryCard (photo, provider name, business, category, phone, website, notes). Link from staff dashboard.
- **ResourceDirectoryCard** – Photo (or initial), provider name, business, category, description, phone, website link, notes.
- **ReferralStatusChip** – Badge for the five referral statuses.
- **AssignResourceSheet** – From family profile Resources tab: search resources, select one, assign to current family (initial status "suggested").
- **Family profile → Resources tab** – Assign resource (sheet), list of assigned resources with status dropdown to change referral status; shows assigned date.

## Admin management readiness

- Resource and category types and service are in place. Later: admin UI to create/update/delete resources and categories (and optionally bulk import). Firestore rules already allow staff create/update for resources and categories; an admin-only section can be added with the same service layer.

## Files created

- `src/types/resources.ts` – ResourceView, AssignedResourceView, AssignResourceInput.
- `src/services/firestore/resourcesService.ts`
- `src/hooks/useResources.ts`, `useFamilyResources.ts`
- `src/features/resources/ReferralStatusChip.tsx`
- `src/features/resources/ResourceDirectoryCard.tsx`
- `src/features/resources/AssignResourceSheet.tsx`
- `src/app/(dashboard)/staff/resources/page.tsx`
- `docs/PHASE12-RESOURCE-DIRECTORY-REFERRALS.md`

## Files changed

- `src/types/domain.ts` – Resource (new fields), ResourceCategory unchanged, FamilyResourceAssignment (assignmentId, memberId, referralStatus), ReferralStatus type.
- `src/types/familyProfile.ts` – FamilyResourceView (assignmentId, referralStatus, providerName, businessName, phone, website).
- `src/constants/index.ts` – STAFF_RESOURCES.
- `src/features/family-profile/ResourcesTab.tsx` – Uses assignments from hook, AssignResourceSheet, ReferralStatusChip, status Select.
- `src/features/family-profile/FamilyProfileView.tsx` – useFamilyResources, useResources, handleAssignResource, handleResourceStatusChange; passes props to ResourcesTab.
- `src/features/dashboard/StaffDashboardView.tsx` – “Resource directory” link in header.
