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
import { useAdminWeeklySubmissions } from "@/hooks/useWeeklyPlanning";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";
import {
  REPORT_CATEGORY_LABELS,
  formatWeekLabel,
  recentWeekStarts,
  weekEndFromWeekStart,
  weekStartFromDate,
} from "@/lib/weeklyPlanningUtils";
import { WeeklyStatusBadge } from "@/features/weekly-planning/WeeklyStatusBadge";
import type { AdminWeekComparisonRow } from "@/types/weeklyPlanning";

function AgendaSummary({ row }: { row: AdminWeekComparisonRow }) {
  const a = row.agenda;
  if (!a) return <p className="text-sm text-muted-foreground">No agenda on file.</p>;
  const sections = [
    { label: "Meetings", items: a.plannedMeetings },
    { label: "Family follow-ups", items: a.plannedFamilyFollowUps },
    { label: "Referrals", items: a.plannedReferrals },
    { label: "Admin tasks", items: a.plannedAdminTasks },
  ];
  return (
    <div className="space-y-2 text-sm">
      {sections.map((s) => (
        <div key={s.label}>
          <p className="font-medium">{s.label}</p>
          {s.items.length === 0 ? (
            <p className="text-muted-foreground">—</p>
          ) : (
            <ul className="list-inside list-disc text-muted-foreground">
              {s.items.map((it) => (
                <li key={it.id}>{it.title || "(untitled)"}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {a.notes ? <p className="text-muted-foreground">Notes: {a.notes}</p> : null}
    </div>
  );
}

function ReportSummary({ row }: { row: AdminWeekComparisonRow }) {
  const r = row.report;
  if (!r) return <p className="text-sm text-muted-foreground">No report on file.</p>;
  if (r.items.length === 0) return <p className="text-sm text-muted-foreground">No activity rows.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {r.items.map((it) => (
        <li key={it.itemId} className="rounded border bg-muted/30 p-2">
          <p className="font-medium">{it.activityDescription || "(no description)"}</p>
          <p className="text-xs text-muted-foreground">
            {REPORT_CATEGORY_LABELS[it.category] ?? it.category} · {it.hoursSpent}h
            {it.location ? ` · ${it.location}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function AdminWeeklySubmissionsView() {
  const { orgId } = useAuth();
  const [staffOpts, setStaffOpts] = useState<{ id: string; label: string }[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  /** Table filter: empty = all weeks */
  const [tableWeekFilter, setTableWeekFilter] = useState("");
  /** Comparison + missing submitters always use a concrete week */
  const [comparisonWeek, setComparisonWeek] = useState(weekStartFromDate());
  const [expanded, setExpanded] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      staffUid: staffFilter || null,
      weekStart: tableWeekFilter || null,
    }),
    [staffFilter, tableWeekFilter],
  );

  const { reports, agendas, comparison, nonSubmitters, isLoading, error, refetch, markAgendaReviewed, markReportReviewed } =
    useAdminWeeklySubmissions(filters, comparisonWeek);

  useEffect(() => {
    if (!orgId) return;
    void fetchSegmentFilterOptions(orgId).then((o) => setStaffOpts(o.staff));
  }, [orgId]);

  const staffSelectOptions = [{ value: "", label: "All staff" }, ...staffOpts.map((s) => ({ value: s.id, label: s.label }))];
  const weekOptions = [
    { value: "", label: "All weeks" },
    ...recentWeekStarts(20).map((ws) => ({
      value: ws,
      label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
    })),
  ];
  const comparisonWeekOptions = recentWeekStarts(20).map((ws) => ({
    value: ws,
    label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
  }));

  if (!orgId) {
    return <EmptyState title="No organization" />;
  }

  if (isLoading && reports.length === 0 && agendas.length === 0) {
    return <LoadingState message="Loading weekly submissions…" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
          Command center
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_WEEKLY_OVERSIGHT}>
          Weekly oversight (planned vs actual)
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter report/agenda tables by staff and optionally by week. Comparison and “missing submissions” use the
            comparison week.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Staff</Label>
            <Select options={staffSelectOptions} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Table week</Label>
            <Select
              options={weekOptions}
              value={tableWeekFilter}
              onChange={(e) => setTableWeekFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Comparison week</Label>
            <Select
              options={comparisonWeekOptions}
              value={comparisonWeek}
              onChange={(e) => setComparisonWeek(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agenda vs report</CardTitle>
          <CardDescription>Compare planned work to submitted activities for the selected week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Staff</TableHead>
                <TableHead>Agenda</TableHead>
                <TableHead>Report</TableHead>
                <TableHead className="text-right">Planned rows</TableHead>
                <TableHead className="text-right">Report hrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No staff to compare.
                  </TableCell>
                </TableRow>
              ) : (
                comparison.map((row) => {
                  const key = row.staffUid;
                  const open = expanded === key;
                  const planned =
                    (row.agenda?.plannedMeetings.length ?? 0) +
                    (row.agenda?.plannedFamilyFollowUps.length ?? 0) +
                    (row.agenda?.plannedReferrals.length ?? 0) +
                    (row.agenda?.plannedAdminTasks.length ?? 0);
                  const hrs = row.report?.totalHours ?? 0;
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
                          {row.agenda ? <WeeklyStatusBadge status={row.agenda.displayStatus} /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.report ? <WeeklyStatusBadge status={row.report.displayStatus} /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{planned}</TableCell>
                        <TableCell className="text-right tabular-nums">{hrs}</TableCell>
                      </TableRow>
                      {open ? (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/20">
                            <div className="grid gap-4 p-4 md:grid-cols-2">
                              <div>
                                <h4 className="mb-2 text-sm font-semibold">Agenda</h4>
                                <AgendaSummary row={row} />
                              </div>
                              <div>
                                <h4 className="mb-2 text-sm font-semibold">Report</h4>
                                <ReportSummary row={row} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missing report submission</CardTitle>
          <CardDescription>Staff who have not submitted or been reviewed for this week.</CardDescription>
        </CardHeader>
        <CardContent>
          {nonSubmitters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everyone has submitted or been marked reviewed.</p>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {nonSubmitters.map((s) => (
                <li key={s.staffUid}>{s.staffLabel}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly reports</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reports match filters.
                  </TableCell>
                </TableRow>
              ) : null}
              {reports.map((r) => (
                <TableRow key={r.reportId}>
                  <TableCell>{r.staffLabel}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatWeekLabel(r.weekStart, r.weekEnd)}</TableCell>
                  <TableCell>
                    <WeeklyStatusBadge status={r.displayStatus} />
                  </TableCell>
                  <TableCell className="text-right">{r.totalHours ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.itemCount}</TableCell>
                  <TableCell>
                    {r.displayStatus === "submitted" ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void markReportReviewed(r.reportId)}>
                        Mark reviewed
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly agendas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Planned rows</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No agendas match filters.
                  </TableCell>
                </TableRow>
              ) : null}
              {agendas.map((a) => (
                <TableRow key={a.agendaId}>
                  <TableCell>{a.staffLabel}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatWeekLabel(a.weekStart, a.weekEnd)}</TableCell>
                  <TableCell>
                    <WeeklyStatusBadge status={a.displayStatus} />
                  </TableCell>
                  <TableCell className="text-right">{a.plannedTotal}</TableCell>
                  <TableCell>
                    {a.displayStatus === "submitted" ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void markAgendaReviewed(a.agendaId)}>
                        Mark reviewed
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
