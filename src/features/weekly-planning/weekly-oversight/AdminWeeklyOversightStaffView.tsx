"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useWeeklyOversightStaff } from "@/hooks/useWeeklyOversight";
import { formatWeekLabel, recentWeekStarts, weekEndFromWeekStart, weekStartFromDate } from "@/lib/weeklyPlanningUtils";
import { WeeklyStatusBadge } from "@/features/weekly-planning/WeeklyStatusBadge";
import { OversightStatusBadge } from "@/features/weekly-planning/weekly-oversight/OversightStatusBadge";
import { WeeklyOversightDrillDown } from "@/features/weekly-planning/weekly-oversight/WeeklyOversightDrillDown";

export function AdminWeeklyOversightStaffView({ staffUid, staffLabel }: { staffUid: string; staffLabel?: string }) {
  const [weekStart, setWeekStart] = useState(weekStartFromDate());
  const { row, isLoading, error } = useWeeklyOversightStaff(staffUid, weekStart);

  const weekOptions = useMemo(
    () =>
      recentWeekStarts(20).map((ws) => ({
        value: ws,
        label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
      })),
    [],
  );

  const title = staffLabel ?? row?.staffLabel ?? staffUid;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_WEEKLY_OVERSIGHT}>
          Back to team oversight
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_WEEKLY_SUBMISSIONS}>
          Weekly submissions
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Planned vs actual for the selected week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Week</Label>
            <Select options={weekOptions} value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          </div>
          {isLoading ? <LoadingState message="Loading…" /> : null}
          {!isLoading && !row ? (
            <EmptyState title="No data" description="This staff member may not be in the reporting directory for this week." />
          ) : null}
          {row ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Oversight</span>
                <OversightStatusBadge status={row.oversightStatus} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Agenda</span>
                {row.agenda ? <WeeklyStatusBadge status={row.agenda.displayStatus} /> : "—"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Report</span>
                {row.report ? <WeeklyStatusBadge status={row.report.displayStatus} /> : "—"}
              </div>
              <span className="tabular-nums text-muted-foreground">
                Planned {row.plannedItemCount} · Completed {row.completedItemCount} · Hrs plan {row.hoursPlanned ?? "—"} · Hrs
                rpt {row.hoursReported ?? "—"}
              </span>
              <span className="text-muted-foreground">
                Tasks due week: {row.openTasksDueInWeek.length} (overdue {row.overdueTasksInWeek.length})
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {row ? (
        <Card>
          <CardHeader>
            <CardTitle>Drill-down</CardTitle>
            <CardDescription>Agenda sections, reported lines, and goal tasks tied to the week.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <WeeklyOversightDrillDown row={row} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
