/**
 * Admin planned vs actual weekly oversight (Phase 21).
 */

import type { GoalTask } from "@/types/domain";
import type { WeeklyAgendaView, WeeklyReportView } from "@/types/weeklyPlanning";

/** Rollup status for agenda vs report alignment (distinct from WeeklySubmissionStatus). */
export type WeeklyOversightStatus = "on_track" | "partially_completed" | "missing_report" | "needs_review";

export interface WeeklyOversightStaffRow {
  staffUid: string;
  staffLabel: string;
  weekStart: string;
  weekEnd: string;
  agenda: WeeklyAgendaView | null;
  report: WeeklyReportView | null;
  plannedItemCount: number;
  completedItemCount: number;
  /** Sum of line-item estimatedHours when any line has a numeric estimate; else null. */
  hoursPlanned: number | null;
  /** Report header totalHours, or sum of line hours when header is null. */
  hoursReported: number | null;
  /** No report doc or report not submitted/reviewed (same signal as legacy missingSubmission). */
  missingReportSubmission: boolean;
  /** No agenda document saved for this week. */
  missingAgenda: boolean;
  /** Open goal tasks assigned to this staff with dueDate in the week. */
  openTasksDueInWeek: GoalTask[];
  /** Subset of openTasksDueInWeek with dueDate before referenceYmd (typically today). */
  overdueTasksInWeek: GoalTask[];
  oversightStatus: WeeklyOversightStatus;
}

export interface WeeklyOversightOrgSummary {
  weekStart: string;
  weekEnd: string;
  staffCount: number;
  totalPlannedItems: number;
  totalCompletedItems: number;
  totalHoursPlanned: number | null;
  totalHoursReported: number | null;
  missingReportCount: number;
  missingAgendaCount: number;
  openTasksDueInWeekCount: number;
  overdueTasksInWeekCount: number;
  byOversightStatus: Record<WeeklyOversightStatus, number>;
}
