/**
 * Goals and tasks view / DTO types for UI and services.
 */

import type { GoalType, TaskAssigneeType } from "@/types/domain";

export interface GoalView {
  goalId: string;
  familyId: string;
  goalType: GoalType;
  title: string;
  description: string | null;
  status: "active" | "completed" | "cancelled";
  targetDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tasksCount?: number;
}

export interface TaskView {
  taskId: string;
  familyId: string;
  goalId: string;
  goalTitle: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "blocked";
  assigneeType: TaskAssigneeType | null;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  taskHistory: TaskHistoryEntryView[];
}

export interface TaskHistoryEntryView {
  at: string;
  by: string;
  byName?: string;
  action: "status_change" | "note" | "assigned" | "due_date_change";
  note?: string;
  meta?: Record<string, unknown>;
}

export interface NextActionView {
  taskId: string;
  familyId: string;
  familyName?: string | null;
  goalId: string;
  goalTitle: string | null;
  title: string;
  dueDate: string | null;
  status: "todo" | "in_progress";
  assigneeName: string | null;
}

export interface CreateGoalInput {
  goalType: GoalType;
  title: string;
  description?: string | null;
  targetDate?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  status?: "active" | "completed" | "cancelled";
  targetDate?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assigneeType: TaskAssigneeType | null;
  assigneeId: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "todo" | "in_progress" | "done" | "blocked";
  dueDate?: string | null;
  assigneeType?: TaskAssigneeType | null;
  assigneeId?: string | null;
}

export interface AddTaskNoteInput {
  note: string;
  action?: "note" | "status_change";
}
