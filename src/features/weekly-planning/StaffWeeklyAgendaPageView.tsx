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
import { useWeeklyAgenda, useStaffFamilyOptions } from "@/hooks/useWeeklyPlanning";
import { formatWeekLabel, recentWeekStarts, weekEndFromWeekStart, weekStartFromDate } from "@/lib/weeklyPlanningUtils";
import type { AgendaLineItem } from "@/types/domain";
import { AgendaSectionEditor } from "@/features/weekly-planning/AgendaSectionEditor";
import { WeeklyStatusBadge } from "@/features/weekly-planning/WeeklyStatusBadge";

export function StaffWeeklyAgendaPageView() {
  const defaultWeek = weekStartFromDate();
  const [weekStart, setWeekStart] = useState(defaultWeek);
  const { agenda, isLoading, error, refetch, saveDraft, submit } = useWeeklyAgenda(weekStart);
  const { options: familyOptions } = useStaffFamilyOptions();

  const [meetings, setMeetings] = useState<AgendaLineItem[]>([]);
  const [followUps, setFollowUps] = useState<AgendaLineItem[]>([]);
  const [referrals, setReferrals] = useState<AgendaLineItem[]>([]);
  const [adminTasks, setAdminTasks] = useState<AgendaLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!agenda) return;
    setMeetings(agenda.plannedMeetings);
    setFollowUps(agenda.plannedFamilyFollowUps);
    setReferrals(agenda.plannedReferrals);
    setAdminTasks(agenda.plannedAdminTasks);
    setNotes(agenda.notes);
  }, [agenda?.agendaId, agenda?.updatedAt, weekStart]);

  const weekOptions = recentWeekStarts(16).map((ws) => ({
    value: ws,
    label: formatWeekLabel(ws, weekEndFromWeekStart(ws)),
  }));

  const deadlineText = agenda?.submissionDueAt
    ? new Date(agenda.submissionDueAt).toLocaleString()
    : "—";

  const handleSaveDraft = async () => {
    setMessage(null);
    try {
      await saveDraft({
        plannedMeetings: meetings,
        plannedFamilyFollowUps: followUps,
        plannedReferrals: referrals,
        plannedAdminTasks: adminTasks,
        notes,
      });
      setMessage("Draft saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleSubmit = async () => {
    setMessage(null);
    try {
      await saveDraft({
        plannedMeetings: meetings,
        plannedFamilyFollowUps: followUps,
        plannedReferrals: referrals,
        plannedAdminTasks: adminTasks,
        notes,
      });
      await submit();
      setMessage("Agenda submitted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Submit failed");
    }
  };

  if (isLoading && !agenda) {
    return <LoadingState message="Loading agenda…" />;
  }

  if (error && !agenda) {
    return (
      <EmptyState
        title="Could not load agenda"
        description={error.message}
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!agenda) {
    return <EmptyState title="Sign in required" />;
  }

  const readOnly = !agenda.canEdit;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF}>
          Staff dashboard
        </Link>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_REPORT}>
          Weekly report
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly agenda</CardTitle>
          <CardDescription>
            Plan meetings, follow-ups, referrals, and admin work. Submit before the deadline to lock your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="wk-ag">Week</Label>
              <Select
                id="wk-ag"
                options={weekOptions}
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Range: </span>
              {formatWeekLabel(agenda.weekStart, agenda.weekEnd)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <WeeklyStatusBadge status={agenda.displayStatus} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Submission deadline: <span className="font-medium text-foreground">{deadlineText}</span>
            {readOnly ? (
              <span className="ml-2 text-amber-700 dark:text-amber-300">(editing closed)</span>
            ) : null}
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <AgendaSectionEditor
        title="Planned meetings"
        description="Sessions, partner meetings, internal huddles."
        items={meetings}
        onChange={setMeetings}
        familyOptions={familyOptions}
        showScheduledAt
        disabled={readOnly}
      />
      <AgendaSectionEditor
        title="Planned family follow-ups"
        items={followUps}
        onChange={setFollowUps}
        familyOptions={familyOptions}
        showFamily
        showDueAt
        disabled={readOnly}
      />
      <AgendaSectionEditor
        title="Planned referrals"
        items={referrals}
        onChange={setReferrals}
        familyOptions={familyOptions}
        showFamily
        disabled={readOnly}
      />
      <AgendaSectionEditor
        title="Planned admin tasks"
        items={adminTasks}
        onChange={setAdminTasks}
        familyOptions={familyOptions}
        showDueAt
        disabled={readOnly}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Week notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly}
            rows={4}
            placeholder="Overall notes for the week…"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={readOnly} onClick={() => void handleSaveDraft()}>
          Save draft
        </Button>
        <Button type="button" disabled={readOnly} onClick={() => void handleSubmit()}>
          Submit agenda
        </Button>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
