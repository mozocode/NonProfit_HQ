import { describe, expect, it } from "vitest";

import {
  aggregateWeeklyOversightOrgSummary,
  computeWeeklyOversightStatus,
  countCompletedReportItems,
  countPlannedItems,
  resolveHoursReported,
  sumPlannedHours,
  partitionOverdueTasksInWeek,
} from "@/lib/weeklyOversightUtils";
import type { WeeklyAgendaView, WeeklyReportView } from "@/types/weeklyPlanning";
import type { WeeklyOversightStaffRow } from "@/types/weeklyOversight";
import type { GoalTask } from "@/types/domain";

function baseAgenda(): WeeklyAgendaView {
  return {
    agendaId: "a1",
    organizationId: "o1",
    staffUid: "u1",
    weekStart: "2025-03-02",
    weekEnd: "2025-03-08",
    plannedMeetings: [{ id: "1", title: "M" }],
    plannedFamilyFollowUps: [{ id: "2", title: "F", estimatedHours: 1.5 }],
    plannedReferrals: [],
    plannedAdminTasks: [],
    notes: "",
    storedStatus: "draft",
    displayStatus: "draft",
    submittedAt: null,
    reviewedAt: null,
    reviewedByUid: null,
    submissionDueAt: "",
    canEdit: true,
    createdAt: "",
    updatedAt: "",
  };
}

function baseReport(overrides: Partial<WeeklyReportView> = {}): WeeklyReportView {
  return {
    reportId: "r1",
    organizationId: "o1",
    staffUid: "u1",
    weekStart: "2025-03-02",
    weekEnd: "2025-03-08",
    items: [
      {
        organizationId: "o1",
        reportId: "r1",
        itemId: "i1",
        activityDescription: "x",
        familyId: null,
        location: null,
        category: "admin",
        hoursSpent: 2,
        notes: null,
        createdAt: "",
        updatedAt: "",
      },
    ],
    notes: null,
    storedStatus: "reviewed",
    displayStatus: "reviewed",
    submittedAt: null,
    reviewedAt: null,
    reviewedByUid: null,
    submissionDueAt: "",
    canEdit: false,
    totalHours: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("weeklyOversightUtils", () => {
  it("countPlannedItems sums sections", () => {
    expect(countPlannedItems(null)).toBe(0);
    expect(countPlannedItems(baseAgenda())).toBe(2);
  });

  it("sumPlannedHours only when estimates present", () => {
    expect(sumPlannedHours(null)).toBeNull();
    expect(sumPlannedHours(baseAgenda())).toBe(1.5);
  });

  it("resolveHoursReported prefers totalHours then sums lines", () => {
    expect(resolveHoursReported(null)).toBeNull();
    expect(resolveHoursReported(baseReport({ totalHours: 9 }))).toBe(9);
    expect(resolveHoursReported(baseReport({ totalHours: null }))).toBe(2);
  });

  it("countCompletedReportItems", () => {
    expect(countCompletedReportItems(null)).toBe(0);
    expect(countCompletedReportItems(baseReport())).toBe(1);
  });

  it("computeWeeklyOversightStatus precedence", () => {
    expect(computeWeeklyOversightStatus(null, 1, 1)).toBe("missing_report");
    expect(computeWeeklyOversightStatus(baseReport({ displayStatus: "draft" }), 1, 1)).toBe("missing_report");
    expect(computeWeeklyOversightStatus(baseReport({ displayStatus: "submitted" }), 1, 1)).toBe("needs_review");
    expect(computeWeeklyOversightStatus(baseReport({ displayStatus: "reviewed" }), 3, 1)).toBe("partially_completed");
    expect(computeWeeklyOversightStatus(baseReport({ displayStatus: "reviewed" }), 1, 1)).toBe("on_track");
    expect(computeWeeklyOversightStatus(baseReport({ displayStatus: "reviewed" }), 0, 0)).toBe("on_track");
  });

  it("partitionOverdueTasksInWeek", () => {
    const tasks: GoalTask[] = [
      {
        organizationId: "o",
        familyId: "f",
        goalId: "g",
        taskId: "t1",
        title: "a",
        description: null,
        status: "todo",
        assigneeType: "staff",
        assigneeId: "u",
        assignedToUid: "u",
        dueDate: "2025-03-05",
        completedAt: null,
        createdBy: "u",
        createdAt: "",
        updatedAt: "",
        taskHistory: [],
      },
    ];
    expect(partitionOverdueTasksInWeek(tasks, "2025-03-10").overdue).toHaveLength(1);
    expect(partitionOverdueTasksInWeek(tasks, "2025-03-01").overdue).toHaveLength(0);
  });

  it("aggregateWeeklyOversightOrgSummary rolls up rows", () => {
    const row: WeeklyOversightStaffRow = {
      staffUid: "u",
      staffLabel: "U",
      weekStart: "2025-03-02",
      weekEnd: "2025-03-08",
      agenda: null,
      report: null,
      plannedItemCount: 2,
      completedItemCount: 1,
      hoursPlanned: 1,
      hoursReported: 3,
      missingReportSubmission: true,
      missingAgenda: true,
      openTasksDueInWeek: [],
      overdueTasksInWeek: [],
      oversightStatus: "missing_report",
    };
    const s = aggregateWeeklyOversightOrgSummary([row], "2025-03-02", "2025-03-08");
    expect(s.staffCount).toBe(1);
    expect(s.totalPlannedItems).toBe(2);
    expect(s.missingReportCount).toBe(1);
    expect(s.byOversightStatus.missing_report).toBe(1);
    expect(s.totalHoursPlanned).toBe(1);
    expect(s.totalHoursReported).toBe(3);
  });
});
