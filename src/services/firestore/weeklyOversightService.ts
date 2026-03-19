/**
 * Admin weekly planned vs actual — composes agenda/report grid + goal tasks (Phase 21).
 */

import { weekEndFromWeekStart } from "@/lib/weeklyPlanningUtils";
import {
  aggregateWeeklyOversightOrgSummary,
  computeWeeklyOversightStatus,
  countCompletedReportItems,
  countPlannedItems,
  partitionOverdueTasksInWeek,
  resolveHoursReported,
  sumPlannedHours,
} from "@/lib/weeklyOversightUtils";
import type { WeeklyOversightOrgSummary, WeeklyOversightStaffRow } from "@/types/weeklyOversight";
import { adminBuildComparisonGrid } from "@/services/firestore/weeklyPlanningService";
import { listOpenTasksDueInWeekByStaff } from "@/services/firestore/goalsTasksService";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function adminFetchWeeklyOversightRows(
  organizationId: string,
  weekStart: string,
  staffUidFilter: string | null,
  options?: { referenceYmd?: string },
): Promise<WeeklyOversightStaffRow[]> {
  const weekEnd = weekEndFromWeekStart(weekStart);
  const referenceYmd = options?.referenceYmd ?? toYmd(new Date());

  const [grid, tasksByStaff] = await Promise.all([
    adminBuildComparisonGrid(organizationId, weekStart, staffUidFilter),
    listOpenTasksDueInWeekByStaff(organizationId, weekStart, weekEnd),
  ]);

  return grid.map((row) => {
    const plannedItemCount = countPlannedItems(row.agenda);
    const completedItemCount = countCompletedReportItems(row.report);
    const hoursPlanned = sumPlannedHours(row.agenda);
    const hoursReported = resolveHoursReported(row.report);
    const openTasksDueInWeek = tasksByStaff.get(row.staffUid) ?? [];
    const { overdue: overdueTasksInWeek } = partitionOverdueTasksInWeek(openTasksDueInWeek, referenceYmd);

    const hasAgendaDoc = Boolean(row.agenda?.updatedAt);
    const missingAgenda = !hasAgendaDoc;

    return {
      staffUid: row.staffUid,
      staffLabel: row.staffLabel,
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
      agenda: row.agenda,
      report: row.report,
      plannedItemCount,
      completedItemCount,
      hoursPlanned,
      hoursReported,
      missingReportSubmission: row.missingSubmission,
      missingAgenda,
      openTasksDueInWeek,
      overdueTasksInWeek,
      oversightStatus: computeWeeklyOversightStatus(row.report, plannedItemCount, completedItemCount),
    };
  });
}

export async function adminFetchWeeklyOversightOrgSummary(
  organizationId: string,
  weekStart: string,
  staffUidFilter: string | null,
  options?: { referenceYmd?: string },
): Promise<{ rows: WeeklyOversightStaffRow[]; summary: WeeklyOversightOrgSummary }> {
  const weekEnd = weekEndFromWeekStart(weekStart);
  const rows = await adminFetchWeeklyOversightRows(organizationId, weekStart, staffUidFilter, options);
  return {
    rows,
    summary: aggregateWeeklyOversightOrgSummary(rows, weekStart, weekEnd),
  };
}
