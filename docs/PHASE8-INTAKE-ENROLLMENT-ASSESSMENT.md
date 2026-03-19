# Phase 8: Intake, enrollment, and assessment flows

## Overview

Staff can complete intake, enrollment, and assessment forms per family. Forms validate with Zod, support saving as draft, and on submit write to Firestore, create audit/timeline entries, and update the family workflow stage.

## Routes

| Path | Purpose |
|------|---------|
| `/staff/family/[familyId]/intake` | Intake form (reason for call, what they tried, challenges, demographics) |
| `/staff/family/[familyId]/enrollment` | Enrollment form (program, start date, notes, terms) |
| `/staff/family/[familyId]/assessment` | Assessment form (type, strengths, needs, goals, recommended services) |

## Validators (Zod)

- **`src/features/intake/schemas.ts`** – `intakeSchema`, `intakeDemographicsSchema`. Required: reasonForInitialCall, whatTheyHaveTried, presentingChallenges. Optional: demographics (preferredLanguage, householdSize, numberOfAdults, numberOfChildren, zipCode).
- **`src/features/enrollment/schemas.ts`** – `enrollmentSchema`. Required: startDate, agreedToTerms (must be true). Optional: programId, enrollmentNotes.
- **`src/features/assessment/schemas.ts`** – `assessmentSchema`. Required: assessmentType, strengths, needs, goalsSummary. Optional: recommendedServices, additionalNotes.

## Service functions

**`src/services/firestore/intakeEnrollmentAssessmentService.ts`**

- **Intake:** `getIntakeByFamily(orgId, familyId)` – returns existing intake or null. One intake doc per family (doc id = familyId). `saveIntakeDraft(orgId, familyId, createdBy, data)` – merge set status draft. `submitIntake(orgId, familyId, submittedBy, data)` – set status submitted, submittedAt, submittedBy; create audit entry `intake_submitted`; update family workflow stage to `"intake"`.
- **Enrollment:** `getEnrollmentByFamily`, `saveEnrollmentDraft`, `submitEnrollment`. One enrollment doc per family (doc id = familyId). On submit: audit `enrollment_completed`, workflow stage `"enrolled"`.
- **Assessment:** `getLatestAssessmentByFamily` – query assessments by organizationId and familyId, return latest. `saveAssessmentDraft` – create new or update existing draft (by assessmentId). `submitAssessment` – set status completed, completedAt; audit `assessment_completed`; workflow stage `"assessment"`.
- **Helpers:** `createAuditEntry(orgId, actorUid, action, resourceType, resourceId, metadata)`, `updateFamilyWorkflowStage(orgId, familyId, workflowStage)` (reads family doc then updateDoc with organizationId, createdBy, createdAt, workflowStage, updatedAt for rules).

## Mutation hooks

- **`src/hooks/useIntakeMutation.ts`** – `useIntakeMutation(familyId)`. Returns `{ existing, isLoading, isSaving, error, refetch, saveDraft, submit }`. Loads intake on mount; saveDraft/submit call service and refetch.
- **`src/hooks/useEnrollmentMutation.ts`** – same pattern for enrollment.
- **`src/hooks/useAssessmentMutation.ts`** – same pattern; uses existing draft assessment id when saving/submitting if status is draft.

## Form components

- **`src/features/intake/IntakeForm.tsx`** – IntakeFormProps: existing, onSaveDraft, onSubmit, isSaving. Fields: reasonForInitialCall (textarea), whatTheyHaveTried (textarea), presentingChallenges (textarea), demographics (preferredLanguage, householdSize, numberOfAdults, numberOfChildren, zipCode). Buttons: Save draft, Submit intake. Resets when existing changes.
- **`src/features/enrollment/EnrollmentForm.tsx`** – programId (select), startDate (date), enrollmentNotes (textarea), agreedToTerms (checkbox). Save draft / Submit enrollment.
- **`src/features/assessment/AssessmentForm.tsx`** – assessmentType (select), strengths, needs, goalsSummary (textareas), recommendedServices (input), additionalNotes (textarea). Save draft / Submit assessment.

## Page files

- **`src/app/(dashboard)/staff/family/[familyId]/intake/page.tsx`** – uses useIntakeMutation, PageHeader, IntakeForm. Loading and error states; back link to family profile.
- **`src/app/(dashboard)/staff/family/[familyId]/enrollment/page.tsx`** – same pattern for enrollment.
- **`src/app/(dashboard)/staff/family/[familyId]/assessment/page.tsx`** – same pattern for assessment.

## Firestore

- **Collections:** intakes (doc id = familyId), enrollments (doc id = familyId), assessments (auto id). All include organizationId, familyId, status, createdBy, createdAt, updatedAt. Submit sets submittedAt/submittedBy (intake), enrolledAt/enrolledBy (enrollment), completedAt (assessment).
- **Audit:** auditLogs entries with action intake_submitted, enrollment_completed, assessment_completed.
- **Family update:** updateDoc on families/{familyId} with workflowStage and updatedAt (and organizationId, createdBy, createdAt for rules).

## Files created

- `src/types/intakeEnrollmentAssessment.ts` – IntakeFormData, IntakeDocument, EnrollmentFormData, EnrollmentDocument, AssessmentFormData, AssessmentDocument
- `src/features/intake/schemas.ts`, `src/features/intake/IntakeForm.tsx`
- `src/features/enrollment/schemas.ts`, `src/features/enrollment/EnrollmentForm.tsx`
- `src/features/assessment/schemas.ts`, `src/features/assessment/AssessmentForm.tsx`
- `src/services/firestore/intakeEnrollmentAssessmentService.ts`
- `src/hooks/useIntakeMutation.ts`, `useEnrollmentMutation.ts`, `useAssessmentMutation.ts`
- `src/app/(dashboard)/staff/family/[familyId]/intake/page.tsx`
- `src/app/(dashboard)/staff/family/[familyId]/enrollment/page.tsx`
- `src/app/(dashboard)/staff/family/[familyId]/assessment/page.tsx`
- `docs/PHASE8-INTAKE-ENROLLMENT-ASSESSMENT.md`

## Files changed

- `src/constants/index.ts` – STAFF_FAMILY_INTAKE, STAFF_FAMILY_ENROLLMENT, STAFF_FAMILY_ASSESSMENT
- `src/services/firestore/collections.ts` – enrollments
- `firestore.rules` – match /enrollments/{docId}

## Linking from family profile

From the family profile overview, link to intake/enrollment/assessment with ROUTES.STAFF_FAMILY_INTAKE(familyId), ROUTES.STAFF_FAMILY_ENROLLMENT(familyId), ROUTES.STAFF_FAMILY_ASSESSMENT(familyId).
