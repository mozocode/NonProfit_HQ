# Phase 7: Family profile module

## Overview

The family profile is a tabbed page showing family summary, primary contact, linked members, demographics, services, assigned staff, workflow stage, next required action, recent staff interactions, and sections for goals, tasks, notes, documents, resources, and timeline. Staff can add family members via a sheet form.

## Route

| Path | Purpose |
|------|---------|
| `/staff/family/[familyId]` | Family profile page (tabs: Overview, Goals, Tasks, Notes, Documents, Resources, Timeline) |

Uses existing staff layout (RoleGate + AppShell).

## Page structure

1. **Page header** – Primary contact name as title; family stage and member count in description; “Back to dashboard” action.
2. **Next required action** – Banner at top (when present) linking to task or family documents.
3. **Tabs** – Overview | Goals | Tasks | Notes | Documents | Resources | Timeline.

### Tab contents

- **Overview** – Family summary card, primary contact card, family members (cards + “Add family member”), recent staff interactions.
- **Goals** – List of goals with status and target date.
- **Tasks** – Task cards with link to task detail.
- **Notes** – Note cards (author, timestamp, visibility).
- **Documents** – Requirements (missing/uploaded/approved) and uploaded documents list.
- **Resources** – Resource cards for assigned resources.
- **Timeline** – Chronological timeline of interactions, notes, document activity.

## Types

**`src/types/familyProfile.ts`**

- `FamilyProfileSummary` – Primary contact, status, member count, workflow stage, assigned staff, services, demographics.
- `FamilyMemberView` – Member display (name, DOB, relationship, isParticipant).
- `NextRequiredAction` – Next task or document action.
- `RecentInteractionView` – Staff interaction for list.
- `FamilyGoalView`, `FamilyTaskView`, `FamilyNoteView`, `FamilyDocumentView`, `FamilyDocumentRequirementView`, `FamilyResourceView`, `FamilyTimelineEntryView`.
- `FamilyProfileData` – Full profile (summary, members, next action, recent interactions, goals, tasks, notes, documents, resources, timeline).

## Service layer

- **`src/services/family/familyProfileService.ts`**
  - `getFamilyProfile(organizationId, familyId)` → `FamilyProfileData`.
  - Uses mock data; replace with Firestore reads (families, familyMembers, goals subcollection, tasks, notes, familyDocumentRequirements, familyDocuments, familyResourceAssignments + resources, interactions for timeline).

- **`src/services/family/mockFamilyProfile.ts`**
  - Mock data and `getMockFamilyProfileData(familyId)`.

## Hooks

- **`src/hooks/useFamilyProfile.ts`**
  - `useFamilyProfile(familyId)` – Fetches profile via `familyProfileService.getFamilyProfile(orgId, familyId)`.
  - Returns `{ data, isLoading, error, refetch }`.

## Reusable subcomponents

| Component | Path | Purpose |
|-----------|------|---------|
| FamilySummaryCard | features/family-profile/FamilySummaryCard | Summary, status, household, stage, staff, services, demographics |
| PrimaryContactCard | features/family-profile/PrimaryContactCard | Name, phone, email |
| FamilyMemberCard | features/family-profile/FamilyMemberCard | Member row/card (name, DOB, relationship, participant badge) |
| AddFamilyMemberSheet | features/family-profile/AddFamilyMemberSheet | Sheet + form to add member (firstName, lastName, DOB, relationship, isParticipant) |
| NextRequiredActionBanner | features/family-profile/NextRequiredActionBanner | Top banner with link to task or documents |
| RecentInteractionsList | features/family-profile/RecentInteractionsList | Recent staff interactions list |
| OverviewTab | features/family-profile/OverviewTab | Overview tab content |
| GoalsTab | features/family-profile/GoalsTab | Goals list |
| TasksTab | features/family-profile/TasksTab | Task cards with links |
| NotesTab | features/family-profile/NotesTab | Note cards |
| DocumentsTab | features/family-profile/DocumentsTab | Requirements + uploaded docs |
| ResourcesTab | features/family-profile/ResourcesTab | Resource cards |
| TimelineTab | features/family-profile/TimelineTab | Timeline items |
| FamilyProfileView | features/family-profile/FamilyProfileView | Main view (header, next action, tabs) |

## Files created

- `src/types/familyProfile.ts`
- `src/services/family/mockFamilyProfile.ts`
- `src/services/family/familyProfileService.ts`
- `src/hooks/useFamilyProfile.ts`
- `src/features/family-profile/FamilySummaryCard.tsx`
- `src/features/family-profile/PrimaryContactCard.tsx`
- `src/features/family-profile/FamilyMemberCard.tsx`
- `src/features/family-profile/AddFamilyMemberSheet.tsx`
- `src/features/family-profile/NextRequiredActionBanner.tsx`
- `src/features/family-profile/RecentInteractionsList.tsx`
- `src/features/family-profile/OverviewTab.tsx`
- `src/features/family-profile/GoalsTab.tsx`
- `src/features/family-profile/TasksTab.tsx`
- `src/features/family-profile/NotesTab.tsx`
- `src/features/family-profile/DocumentsTab.tsx`
- `src/features/family-profile/ResourcesTab.tsx`
- `src/features/family-profile/TimelineTab.tsx`
- `src/features/family-profile/FamilyProfileView.tsx`
- `docs/PHASE7-FAMILY-PROFILE.md`

## Files changed

- `src/app/(dashboard)/staff/family/[familyId]/page.tsx` – Renders `FamilyProfileView` only.

## Responsive behavior

- Summary and primary contact: two-column grid on `lg`, single column on smaller screens.
- Family members: 1–3 columns (sm: 2, lg: 3).
- Tabs: TabsList wraps with `flex-wrap` on small screens.
- Cards and lists use responsive padding and spacing.

## Firebase integration (later)

- Replace mock in `familyProfileService.getFamilyProfile` with Firestore:
  - `families/{familyId}`
  - `familyMembers` where `familyId`
  - `families/{id}/goals` subcollection
  - Goal tasks (goalTasks or tasks by family/goal)
  - `notes` where `familyId`
  - `familyDocumentRequirements`, `familyDocuments` where `familyId`
  - `familyResourceAssignments` + `resources`
  - `interactions` for timeline
- Implement `addFamilyMember` in service and call from AddFamilyMemberSheet.
