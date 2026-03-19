# Phase 10: Workflow progression system

## Overview

Families progress through standard workflow stages (intake, assessment, planning, intervention, follow-up, evaluation). Each family has a current stage, stage history, next action (from tasks), and an overdue state. The UI includes a visual pipeline and supports changing stage with an optional note. The design is open for admin-managed workflow templates later.

## Standard stages

- **intake**
- **assessment**
- **planning**
- **intervention**
- **follow_up**
- **evaluation**

(Other values such as `enrolled` may be set by intake/enrollment/assessment flows; they are valid but not in the standard pipeline order.)

## Data model

- **Family document** (existing): `workflowStage` (string), and **stageHistory** (array of `{ stage, enteredAt, enteredBy?, note? }`). When stage is updated (via workflow service or intake/enrollment/assessment submit), history is appended and `workflowStage` is set.

## Types (`src/types/workflow.ts`)

- **WORKFLOW_STAGES** – readonly tuple of standard stage IDs.
- **WorkflowStageId** – type for standard stages.
- **StageHistoryEntry** – stage, enteredAt, enteredBy?, note?.
- **FamilyWorkflowState** – familyId, currentStage, stageHistory, nextAction, isOverdue, updatedAt.
- **WorkflowNextAction** – id, type, title, dueDate, familyId.
- **WorkflowTemplate** / **WorkflowTemplateStage** – for future admin-managed templates.

## Helper utilities (`src/lib/workflowUtils.ts`)

- **getStandardStages()** – ordered list of standard stage IDs.
- **getStageLabel(stageId)** – human-readable label.
- **getStageOrder(stageId)** – 0-based index in standard order; -1 if not standard.
- **getNextStage(stageId)** / **getPreviousStage(stageId)** – adjacent stage or null.
- **isStageBefore(a, b)** / **isStageReached(stageId, currentStageId)** – order comparison.
- **isStandardStage(stageId)** – whether stage is in the standard list.
- **isNextActionOverdue(dueDate)** – true if due date is in the past.

## Service (`src/services/firestore/workflowService.ts`)

- **getWorkflowState(organizationId, familyId)** – reads family doc and next action (from goalsTasksService), returns FamilyWorkflowState (currentStage, stageHistory, nextAction, isOverdue).
- **updateWorkflowStage(organizationId, familyId, stage, options?: { enteredBy?, note? })** – updates family’s workflowStage, appends to stageHistory, preserves immutable fields.

Intake/enrollment/assessment service **updateFamilyWorkflowStage** now also appends to **stageHistory** and accepts **enteredBy** so submissions record who moved the stage.

## Hook

- **useFamilyWorkflow(familyId)** – returns `{ state, isLoading, error, refetch, updateStage, isUpdating }`.

## Workflow components

- **WorkflowStepper** – horizontal pipeline of standard stages; shows current, completed (check), and upcoming; supports optional custom `stages` prop for future templates.
- **WorkflowStageHistory** – timeline of stage history entries (newest first).
- **WorkflowNextActionCard** – next action with link; highlights overdue state.
- **ChangeStageSheet** – sheet with stage select and optional note; calls onStageChange(stage, note).
- **WorkflowTab** – combines stepper, next action card, stage history, “Change stage” sheet, and a “Tasks in this stage” section (link to Tasks tab; ready for stage-scoped tasks later).

## Workflow views

- **Family profile → Workflow tab** – full workflow view: current stage badge, overdue badge, Change stage, pipeline, next action, stage history, tasks-in-stage link.

## Custom tasks within stages

- “Tasks in this stage” section in WorkflowTab links to the family profile Tasks tab. Stage-scoped tasks can be added later (e.g. goals/tasks tagged with workflow stage or template-driven stage tasks).

## Admin-managed workflow templates (future)

- **WorkflowTemplate** and **WorkflowTemplateStage** types are defined.
- **WorkflowStepper** accepts optional **stages** prop so it can be driven by a template.
- Helpers use **getStandardStages()** by default; a future layer can supply stages from an org template in Firestore.

## Files created

- `src/types/workflow.ts`
- `src/lib/workflowUtils.ts`
- `src/services/firestore/workflowService.ts`
- `src/hooks/useFamilyWorkflow.ts`
- `src/features/workflow/WorkflowStepper.tsx`
- `src/features/workflow/WorkflowStageHistory.tsx`
- `src/features/workflow/WorkflowNextActionCard.tsx`
- `src/features/workflow/ChangeStageSheet.tsx`
- `src/features/workflow/WorkflowTab.tsx`
- `docs/PHASE10-WORKFLOW-PROGRESSION.md`

## Files changed

- `src/features/family-profile/FamilyProfileView.tsx` – added Workflow tab and useFamilyWorkflow; render WorkflowTab with state, updateStage, isUpdating.
- `src/services/firestore/intakeEnrollmentAssessmentService.ts` – updateFamilyWorkflowStage now appends to stageHistory and accepts optional enteredBy; submitIntake, submitEnrollment, submitAssessment pass the acting user into updateFamilyWorkflowStage.

## Firestore

- Family documents may now include **stageHistory** (array of maps: stage, enteredAt, enteredBy, note). Security rules unchanged; staff can update family with workflowStage and stageHistory.
