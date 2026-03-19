/**
 * Workflow helper utilities: stage order, labels, next stage, overdue.
 * Uses standard stages; can later read from WorkflowTemplate.
 */

import { WORKFLOW_STAGES, type WorkflowStageId } from "@/types/workflow";

const STAGE_LABELS: Record<string, string> = {
  intake: "Intake",
  assessment: "Assessment",
  planning: "Planning",
  intervention: "Intervention",
  follow_up: "Follow-up",
  evaluation: "Evaluation",
};

/** Ordered list of standard stage IDs. */
export function getStandardStages(): readonly WorkflowStageId[] {
  return WORKFLOW_STAGES;
}

/** Human-readable label for a stage ID. */
export function getStageLabel(stageId: string): string {
  return STAGE_LABELS[stageId] ?? stageId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** 0-based index of stage in standard order; -1 if not standard. */
export function getStageOrder(stageId: string): number {
  const i = WORKFLOW_STAGES.indexOf(stageId as WorkflowStageId);
  return i >= 0 ? i : -1;
}

/** Next stage in standard order, or null if last/unknown. */
export function getNextStage(stageId: string): string | null {
  const order = getStageOrder(stageId);
  if (order < 0 || order >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[order + 1];
}

/** Previous stage in standard order, or null if first/unknown. */
export function getPreviousStage(stageId: string): string | null {
  const order = getStageOrder(stageId);
  if (order <= 0) return null;
  return WORKFLOW_STAGES[order - 1];
}

/** Whether this stage is before another in standard order. */
export function isStageBefore(stageId: string, otherStageId: string): boolean {
  const a = getStageOrder(stageId);
  const b = getStageOrder(otherStageId);
  if (a < 0 || b < 0) return false;
  return a < b;
}

/** Whether this stage is the same or after another in standard order. */
export function isStageReached(stageId: string, currentStageId: string): boolean {
  const a = getStageOrder(stageId);
  const b = getStageOrder(currentStageId);
  if (a < 0 || b < 0) return false;
  return b >= a;
}

/** Whether the stage is one of the standard workflow stages. */
export function isStandardStage(stageId: string): boolean {
  return getStageOrder(stageId) >= 0;
}

/** Whether next action is overdue (due date in the past). */
export function isNextActionOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch {
    return false;
  }
}
