"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useWeeklyReport, useStaffFamilyOptions } from "@/hooks/useWeeklyPlanning";
import { formatWeekLabel, recentWeekStarts, weekEndFromWeekStart, weekStartFromDate } from "@/lib/weeklyPlanningUtils";
import { ReportItemEntryForm } from "@/features/weekly-planning/ReportItemEntryForm";
import { WeeklyStatusBadge } from "@/features/weekly-planning/WeeklyStatusBadge";

export function StaffWeeklyReportPageView() {
  const defaultWeek = weekStartFromDate();
  const [weekStart, setWeekStart] = useState(defaultWeek);
  const { report, isLoading, error, refetch, saveNotes, submit, saveItem, removeItem } = useWeeklyReport(weekStart);
  const { options: familyOptions } = useStaffFamilyOptions();

  const [weekNotes, setWeekNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!report) return;
    setWeekNotes(report.notes ?? "");
  }, [report?.reportId, report?.updatedAt, weekStart]);

  const weekOptions = recentWeekStarts(16).map((ws) => ({
    value: ws,
    label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
  }));

  const saveWeekNotes = async () => {
    setMessage(null);
    try {
      await saveNotes(weekNotes.trim() || null);
      setMessage("Week notes saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to save notes");
    }
  };

  const handleSubmit = async () => {
    setMessage(null);
    try {
      await saveNotes(weekNotes.trim() || null);
      await submit();
      setMessage("Report submitted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Submit failed");
    }
  };

  if (isLoading && !report) {
    return <LoadingState message="Loading report…" />;
  }

  if (error && !report) {
    return (
      <EmptyState
        title="Could not load report"
        description={error.message}
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!report) {
    return <EmptyState title="Sign in required" />;
  }

  const readOnly = !report.canEdit;
  const deadlineText = report.submissionDueAt ? new Date(report.submissionDueAt).toLocaleString() : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF}>
          Staff dashboard
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_AGENDA}>
          Weekly agenda
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly report</CardTitle>
          <CardDescription>
            Log completed activities with hours, location, and category. Link a family when the work ties to a case.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="wk-rp">Week</Label>
              <Select
                id="wk-rp"
                options={weekOptions}
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Range: </span>
              {formatWeekLabel(report.weekStart, report.weekEnd)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <WeeklyStatusBadge status={report.displayStatus} />
            </div>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Total hours (from activities): </span>
            <span className="font-semibold tabular-nums">{report.totalHours ?? 0}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Submission deadline: <span className="font-medium text-foreground">{deadlineText}</span>
            {readOnly ? (
              <span className="ml-2 text-amber-700 dark:text-amber-300">(editing closed)</span>
            ) : null}
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Week-level notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={weekNotes}
            onChange={(e) => setWeekNotes(e.target.value)}
            disabled={readOnly}
            rows={3}
          />
          <Button type="button" variant="secondary" size="sm" disabled={readOnly} onClick={() => void saveWeekNotes()}>
            Save notes
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Completed activities</h2>
        {report.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities yet. Add your first below.</p>
        ) : (
          <ul className="space-y-4">
            {report.items.map((item) => (
              <li key={item.itemId}>
                <ReportItemEntryForm
                  item={item}
                  familyOptions={familyOptions}
                  onSave={(p) => saveItem(p)}
                  onDelete={(id) => removeItem(id)}
                  disabled={readOnly}
                />
              </li>
            ))}
          </ul>
        )}

        {!readOnly ? (
          <div>
            <h3 className="mb-2 text-sm font-medium">Add activity</h3>
            <ReportItemEntryForm
              item={null}
              familyOptions={familyOptions}
              onSave={(p) => saveItem(p)}
              disabled={readOnly}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={readOnly} onClick={() => void handleSubmit()}>
          Submit report
        </Button>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
