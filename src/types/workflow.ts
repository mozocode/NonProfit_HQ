/**
 * Workflow progression types. Standard stages today; structure supports
 * admin-managed workflow templates later (e.g. stages from Firestore).
 */

/** Standard workflow stages. Extend or replace via template in future. */
export const WORKFLOW_STAGES = [
  "intake",
  "assessment",
  "planning",
  "intervention",
  "follow_up",
  "evaluation",
] as const;

export type WorkflowStageId = (typeof WORKFLOW_STAGES)[number];

/** Single entry in stage history when a family moves to a stage. */
export interface StageHistoryEntry {
  stage: string;
  enteredAt: string;
  enteredBy?: string | null;
  note?: string | null;
}

/** Workflow state for a family (current stage, history, next action, overdue). */
export interface FamilyWorkflowState {
  familyId: string;
  currentStage: string;
  stageHistory: StageHistoryEntry[];
  nextAction: WorkflowNextAction | null;
  isOverdue: boolean;
  updatedAt: string | null;
}

export interface WorkflowNextAction {
  id: string;
  type: "task" | "document" | "interaction";
  title: string;
  dueDate: string | null;
  familyId: string;
}

/** For future: org-level workflow template (admin-managed). */
export interface WorkflowTemplateStage {
  id: string;
  label: string;
  order: number;
  description?: string | null;
}

export interface WorkflowTemplate {
  organizationId: string;
  templateId: string;
  name: string;
  stages: WorkflowTemplateStage[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}
