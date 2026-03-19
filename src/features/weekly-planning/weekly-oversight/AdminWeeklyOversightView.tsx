"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyOversight } from "@/hooks/useWeeklyOversight";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";
import { formatWeekLabel, recentWeekStarts, weekEndFromWeekStart, weekStartFromDate } from "@/lib/weeklyPlanningUtils";
import { WeeklyStatusBadge } from "@/features/weekly-planning/WeeklyStatusBadge";
import { OversightStatusBadge } from "@/features/weekly-planning/weekly-oversight/OversightStatusBadge";
import { WeeklyOversightOrgSummaryCard } from "@/features/weekly-planning/weekly-oversight/WeeklyOversightOrgSummaryCard";
import { WeeklyOversightDrillDown } from "@/features/weekly-planning/weekly-oversight/WeeklyOversightDrillDown";

export function AdminWeeklyOversightView() {
  const { orgId } = useAuth();
  const [staffOpts, setStaffOpts] = useState<{ id: string; label: string }[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [weekStart, setWeekStart] = useState(weekStartFromDate());
  const [expanded, setExpanded] = useState<string | null>(null);

  const staffUidFilter = staffFilter || null;

  const { rows, summary, isLoading, error, refetch } = useWeeklyOversight(weekStart, staffUidFilter);

  useEffect(() => {
    if (!orgId) return;
    void fetchSegmentFilterOptions(orgId).then((o) => setStaffOpts(o.staff));
  }, [orgId]);

  const weekOptions = useMemo(
    () =>
      recentWeekStarts(20).map((ws) => ({
        value: ws,
        label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
      })),
    [],
  );

  const staffSelectOptions = [{ value: "", label: "All staff" }, ...staffOpts.map((s) => ({ value: s.id, label: s.label }))];

  if (!orgId) {
    return <EmptyState title="No organization" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
          Command center
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_WEEKLY_SUBMISSIONS}>
          Weekly submissions (tables)
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Pick a week to compare planned agendas vs submitted reports across the team.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Week</Label>
            <Select options={weekOptions} value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Staff</Label>
            <Select options={staffSelectOptions} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && !summary ? <LoadingState message="Loading oversight…" /> : null}
      {summary ? <WeeklyOversightOrgSummaryCard summary={summary} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Per-staff comparison</CardTitle>
          <CardDescription>
            Expand a row for agenda detail, report line items, and tasks due in the week. Open a staff drill-down page for a
            focused view.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && rows.length === 0 ? <LoadingState message="Loading rows…" /> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Staff</TableHead>
                <TableHead>Oversight</TableHead>
                <TableHead>Agenda</TableHead>
                <TableHead>Report</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Hrs plan</TableHead>
                <TableHead className="text-right">Hrs rpt</TableHead>
                <TableHead className="text-center">Miss rpt</TableHead>
                <TableHead className="text-center">Tasks</TableHead>
                <TableHead className="text-center">Overdue</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground">
                    No staff in directory for this filter.
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => {
                const key = row.staffUid;
                const open = expanded === key;
                return (
                  <Fragment key={key}>
                    <TableRow>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-8 shrink-0 p-0"
                          onClick={() => setExpanded(open ? null : key)}
                          aria-expanded={open}
                        >
                          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{row.staffLabel}</TableCell>
                      <TableCell>
                        <OversightStatusBadge status={row.oversightStatus} />
                      </TableCell>
                      <TableCell>
                        {row.agenda ? <WeeklyStatusBadge status={row.agenda.displayStatus} /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {row.report ? <WeeklyStatusBadge status={row.report.displayStatus} /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.plannedItemCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.completedItemCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.hoursPlanned ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.hoursReported ?? "—"}</TableCell>
                      <TableCell className="text-center">{row.missingReportSubmission ? "Yes" : "—"}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.openTasksDueInWeek.length}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.overdueTasksInWeek.length}</TableCell>
                      <TableCell>
                        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_WEEKLY_OVERSIGHT_STAFF(row.staffUid)}>
                          Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                    {open ? (
                      <TableRow>
                        <TableCell colSpan={13} className="bg-muted/20 p-0">
                          <WeeklyOversightDrillDown row={row} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
