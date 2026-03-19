/**
 * Pure goal-task helpers (Phase 23 — for tests and consistent filtering).
 */

import type { GoalTask } from "@/types/domain";

export function isOpenGoalTaskStatus(status: GoalTask["status"]): boolean {
  return status === "todo" || status === "in_progress" || status === "blocked";
}

/** YYYY-MM-DD due date within [weekStart, weekEnd] inclusive. */
export function isDueDateInWeek(dueDate: string | null, weekStart: string, weekEnd: string): boolean {
  if (!dueDate) return false;
  return dueDate >= weekStart && dueDate <= weekEnd;
}
