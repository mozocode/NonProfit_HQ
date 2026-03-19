"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWeekLabel } from "@/lib/weeklyPlanningUtils";
import type { WeeklyOversightOrgSummary, WeeklyOversightStatus } from "@/types/weeklyOversight";
import { OversightStatusBadge } from "@/features/weekly-planning/weekly-oversight/OversightStatusBadge";

export function WeeklyOversightOrgSummaryCard({ summary }: { summary: WeeklyOversightOrgSummary }) {
  const statusOrder: WeeklyOversightStatus[] = ["on_track", "needs_review", "partially_completed", "missing_report"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization summary</CardTitle>
        <CardDescription>
          {formatWeekLabel(summary.weekStart, summary.weekEnd)} · {summary.staffCount} staff in directory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Planned items (total)</p>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalPlannedItems}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Reported activities (total)</p>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalCompletedItems}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Hours planned</p>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalHoursPlanned ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">When agenda lines include estimates</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Hours reported</p>
            <p className="text-2xl font-semibold tabular-nums">{summary.totalHoursReported ?? "—"}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Missing report submission</p>
            <p className="text-lg font-semibold tabular-nums">{summary.missingReportCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Missing agenda</p>
            <p className="text-lg font-semibold tabular-nums">{summary.missingAgendaCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Open tasks due this week</p>
            <p className="text-lg font-semibold tabular-nums">{summary.openTasksDueInWeekCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Overdue (due date &lt; today)</p>
            <p className="text-lg font-semibold tabular-nums">{summary.overdueTasksInWeekCount}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">By oversight status</p>
          <ul className="flex flex-wrap gap-2">
            {statusOrder.map((s) => (
              <li key={s} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                <OversightStatusBadge status={s} />
                <span className="tabular-nums font-semibold">{summary.byOversightStatus[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
