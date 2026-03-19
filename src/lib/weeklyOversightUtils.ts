/**
 * Aggregation + status rules for weekly planned vs actual oversight (Phase 21).
 */

import type { AgendaLineItem, GoalTask } from "@/types/domain";
import type { WeeklyAgendaView, WeeklyReportView } from "@/types/weeklyPlanning";
import type { WeeklyOversightOrgSummary, WeeklyOversightStaffRow, WeeklyOversightStatus } from "@/types/weeklyOversight";

function sumEstimatedHoursFromLines(items: AgendaLineItem[]): { sum: number; hasAny: boolean } {
  let sum = 0;
  let hasAny = false;
  for (const it of items) {
    if (it.estimatedHours != null && typeof it.estimatedHours === "number" && !Number.isNaN(it.estimatedHours)) {
      sum += it.estimatedHours;
      hasAny = true;
    }
  }
  return { sum, hasAny };
}

/** Count planned line items across all agenda sections. */
export function countPlannedItems(agenda: WeeklyAgendaView | null): number {
  if (!agenda) return 0;
  return (
    agenda.plannedMeetings.length +
    agenda.plannedFamilyFollowUps.length +
    agenda.plannedReferrals.length +
    agenda.plannedAdminTasks.length
  );
}

/** Sum optional per-line estimated hours; null if no estimates on file. */
export function sumPlannedHours(agenda: WeeklyAgendaView | null): number | null {
  if (!agenda) return null;
  const parts = [
    ...agenda.plannedMeetings,
    ...agenda.plannedFamilyFollowUps,
    ...agenda.plannedReferrals,
    ...agenda.plannedAdminTasks,
  ];
  const { sum, hasAny } = sumEstimatedHoursFromLines(parts);
  return hasAny ? Math.round(sum * 100) / 100 : null;
}

export function countCompletedReportItems(report: WeeklyReportView | null): number {
  return report?.items.length ?? 0;
}

/** Prefer report totalHours; else sum line hours. */
export function resolveHoursReported(report: WeeklyReportView | null): number | null {
  if (!report) return null;
  if (report.totalHours != null && typeof report.totalHours === "number" && !Number.isNaN(report.totalHours)) {
    return report.totalHours;
  }
  const sum = report.items.reduce((s, it) => s + (typeof it.hoursSpent === "number" ? it.hoursSpent : 0), 0);
  return report.items.length ? Math.round(sum * 100) / 100 : null;
}

/**
 * Classify oversight from submission state + planned vs logged activity counts.
 * Precedence: missing report → needs review → partial → on track.
 */
export function computeWeeklyOversightStatus(
  report: WeeklyReportView | null,
  plannedCount: number,
  completedCount: number,
): WeeklyOversightStatus {
  if (!report || (report.displayStatus !== "submitted" && report.displayStatus !== "reviewed")) {
    return "missing_report";
  }
  if (report.displayStatus === "submitted") {
    return "needs_review";
  }
  if (plannedCount > 0 && completedCount < plannedCount) {
    return "partially_completed";
  }
  return "on_track";
}

export function partitionOverdueTasksInWeek(openTasksDueInWeek: GoalTask[], referenceYmd: string): { overdue: GoalTask[] } {
  const overdue = openTasksDueInWeek.filter((t) => t.dueDate && t.dueDate < referenceYmd);
  return { overdue };
}

const emptyStatusCounts = (): Record<WeeklyOversightStatus, number> => ({
  on_track: 0,
  partially_completed: 0,
  missing_report: 0,
  needs_review: 0,
});

export function aggregateWeeklyOversightOrgSummary(
  rows: WeeklyOversightStaffRow[],
  weekStart: string,
  weekEnd: string,
): WeeklyOversightOrgSummary {
  const byOversightStatus = emptyStatusCounts();
  let totalHoursPlanned: number | null = null;
  let totalHoursReported: number | null = null;

  for (const r of rows) {
    byOversightStatus[r.oversightStatus] += 1;
    if (r.hoursPlanned != null) {
      totalHoursPlanned = (totalHoursPlanned ?? 0) + r.hoursPlanned;
    }
    if (r.hoursReported != null) {
      totalHoursReported = (totalHoursReported ?? 0) + r.hoursReported;
    }
  }

  const anyPlannedHours = rows.some((r) => r.hoursPlanned != null);
  const anyReportedHours = rows.some((r) => r.hoursReported != null);

  return {
    weekStart,
    weekEnd,
    staffCount: rows.length,
    totalPlannedItems: rows.reduce((s, r) => s + r.plannedItemCount, 0),
    totalCompletedItems: rows.reduce((s, r) => s + r.completedItemCount, 0),
    totalHoursPlanned: anyPlannedHours ? Math.round((totalHoursPlanned ?? 0) * 100) / 100 : null,
    totalHoursReported: anyReportedHours ? Math.round((totalHoursReported ?? 0) * 100) / 100 : null,
    missingReportCount: rows.filter((r) => r.missingReportSubmission).length,
    missingAgendaCount: rows.filter((r) => r.missingAgenda).length,
    openTasksDueInWeekCount: rows.reduce((s, r) => s + r.openTasksDueInWeek.length, 0),
    overdueTasksInWeekCount: rows.reduce((s, r) => s + r.overdueTasksInWeek.length, 0),
    byOversightStatus,
  };
}
