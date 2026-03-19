"use client";

import {
  AlertCircle,
  Calendar,
  CheckSquare,
  ChevronRight,
  FileWarning,
  ListTodo,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DocumentStatusChip } from "@/components/ui/document-status-chip";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { TaskCard } from "@/components/ui/task-card";
import { ROUTES } from "@/constants";
import { useStaffDashboard } from "@/hooks/useStaffDashboard";
import { useAttentionSummary } from "@/hooks/useRemindersPrompts";
import { WhatNeedsAttentionSection } from "@/features/reminders/WhatNeedsAttentionSection";
import { cn } from "@/lib/utils";

type ActionFilter = "all" | "overdue" | "tasks" | "documents" | "reminders";

export function StaffDashboardView() {
  const { data, isLoading, error, refetch } = useStaffDashboard();
  const { items: attentionItems, isLoading: attentionLoading } = useAttentionSummary();
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const actionItems = useMemo(() => {
    if (!data) return [];
    const items: Array<{
      id: string;
      type: ActionFilter;
      title: string;
      subtitle: string | null;
      href: string;
      familyId?: string;
      taskId?: string;
      due?: string;
    }> = [];
    data.overdueFollowUps.forEach((o) => {
      items.push({
        id: `overdue_${o.id}`,
        type: "overdue",
        title: o.title,
        subtitle: o.familyName,
        href: o.type === "task" ? ROUTES.STAFF_TASK(o.id) : ROUTES.STAFF_FAMILY(o.familyId),
        familyId: o.familyId,
        taskId: o.type === "task" ? o.id : undefined,
        due: o.dueDate,
      });
    });
    data.missingDocuments.slice(0, 3).forEach((m) => {
      items.push({
        id: `doc_${m.requirementId}`,
        type: "documents",
        title: m.templateName,
        subtitle: m.familyName,
        href: ROUTES.STAFF_FAMILY(m.familyId),
        familyId: m.familyId,
        due: m.dueDate ?? undefined,
      });
    });
    data.remindersNeedingAck.forEach((r) => {
      items.push({
        id: `rem_${r.reminderId}`,
        type: "reminders",
        title: r.title,
        subtitle: r.familyName,
        href: r.type === "document" ? ROUTES.STAFF_FAMILY(r.familyId!) : ROUTES.STAFF_TASK(r.targetId),
        familyId: r.familyId ?? undefined,
        due: r.dueAt.slice(0, 10),
      });
    });
    data.upcomingTasks.slice(0, 2).forEach((t) => {
      items.push({
        id: `task_${t.taskId}`,
        type: "tasks",
        title: t.title,
        subtitle: t.familyName ?? null,
        href: ROUTES.STAFF_TASK(t.taskId),
        taskId: t.taskId,
        familyId: t.familyId ?? undefined,
        due: t.dueDate ?? undefined,
      });
    });
    return items;
  }, [data]);

  const filteredActionItems = useMemo(() => {
    if (actionFilter === "all") return actionItems;
    return actionItems.filter((i) => i.type === actionFilter);
  }, [actionItems, actionFilter]);

  if (isLoading) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data"
        description="Assignments and data will appear here."
      />
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Dashboard"
        description="Your caseload, tasks, and this week at a glance."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_SURVEYS}>
              Surveys
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_REMINDERS}>
              Reminder center
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_RESOURCES}>
              Resource directory
            </Link>
            <Link className={buttonVariants()} href={ROUTES.STAFF_REPORT}>
              Submit weekly report
            </Link>
          </div>
        }
      />

      {/* What needs attention today */}
      <WhatNeedsAttentionSection items={attentionItems} isLoading={attentionLoading} />

      {/* Next action — single most important item */}
      {actionItems.length > 0 && (
        <Link href={actionItems[0].href} className="block">
          <Card className="border-status-warning/50 bg-status-warning-muted/30 transition-colors hover:bg-status-warning-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="size-8 shrink-0 text-status-warning" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Next required action
                </p>
                <p className="font-semibold text-foreground">{actionItems[0].title}</p>
                {actionItems[0].subtitle ? (
                  <p className="text-sm text-muted-foreground">{actionItems[0].subtitle}</p>
                ) : null}
                {actionItems[0].due ? (
                  <DueDateChip dueDate={actionItems[0].due} className="mt-1" />
                ) : null}
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Assigned families"
          value={summary.assignedFamiliesCount}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="Overdue follow-ups"
          value={summary.overdueFollowUpsCount}
          icon={<AlertCircle className="size-4" />}
        />
        <StatCard
          title="Missing documents"
          value={summary.missingDocumentsCount}
          icon={<FileWarning className="size-4" />}
        />
        <StatCard
          title="Upcoming tasks"
          value={summary.upcomingTasksCount}
          icon={<CheckSquare className="size-4" />}
        />
        <StatCard
          title="Reminders to ack"
          value={summary.remindersNeedingAckCount}
          icon={<MessageSquare className="size-4" />}
        />
        <StatCard
          title="Action prompts"
          value={summary.unresolvedPromptsCount}
          icon={<ListTodo className="size-4" />}
        />
      </div>

      {/* Quick filters + Action list */}
      <Section
        title="Action list"
        description="Overdue items, reminders, and next tasks."
      >
        <FilterBar
          onClear={actionFilter !== "all" ? () => setActionFilter("all") : undefined}
          clearLabel="Show all"
        >
          {(["all", "overdue", "tasks", "documents", "reminders"] as const).map((f) => (
            <Button
              key={f}
              variant={actionFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </FilterBar>
        <Card>
          <CardContent className="p-0">
            {filteredActionItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No items in this filter.
              </div>
            ) : (
              <ul className="divide-y">
                {filteredActionItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.subtitle ? (
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        ) : null}
                        {item.due ? (
                          <DueDateChip dueDate={item.due} showIcon={false} className="mt-1" />
                        ) : null}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned families */}
        <Section
          title="Assigned families"
          action={
            data.assignedFamilies.length > 0 ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={ROUTES.STAFF_FAMILY(data.assignedFamilies[0].familyId)}
              >
                View all
              </Link>
            ) : null
          }
        >
          {data.assignedFamilies.length === 0 ? (
            <EmptyState title="No assigned families" description="Families you’re assigned to will appear here." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {data.assignedFamilies.map((f) => (
                    <li key={f.familyId}>
                      <Link
                        href={ROUTES.STAFF_FAMILY(f.familyId)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                      >
                        <span className="text-sm font-medium">{f.primaryContactName}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </Section>

        {/* Today's schedule */}
        <Section
          title="Today's schedule"
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={ROUTES.STAFF_SCHEDULE}
            >
              View schedule
            </Link>
          }
        >
          {data.todaysSchedule.length === 0 ? (
            <EmptyState title="No appointments today" description="Your schedule is clear." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {data.todaysSchedule.map((ent) => (
                    <li key={ent.entryId}>
                      <Link
                        href={ROUTES.STAFF_SCHEDULE}
                        className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{ent.title ?? ent.type}</p>
                          {ent.location ? (
                            <p className="text-xs text-muted-foreground">{ent.location}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {formatTime(ent.startAt)} – {formatTime(ent.endAt)}
                          </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </Section>
      </div>

      {/* This week's agenda */}
      <Section
        title="This week's planned agenda"
        action={
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={ROUTES.STAFF_AGENDA}
          >
            Edit agenda
          </Link>
        }
      >
        {data.thisWeekAgenda && data.thisWeekAgenda.items.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.thisWeekAgenda.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{item.title}</span>
                    {item.familyName ? (
                      <span className="text-xs text-muted-foreground">{item.familyName}</span>
                    ) : null}
                    {item.dueAt ? (
                      <DueDateChip dueDate={item.dueAt} showIcon={false} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No agenda for this week"
            description="Add planned work from the agenda page."
            action={
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={ROUTES.STAFF_AGENDA}
              >
                Go to agenda
              </Link>
            }
          />
        )}
      </Section>

      {/* Upcoming tasks */}
      <Section title="Upcoming tasks">
        {data.upcomingTasks.length === 0 ? (
          <EmptyState title="No upcoming tasks" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.upcomingTasks.map((t) => (
              <li key={t.taskId}>
                <Link href={ROUTES.STAFF_TASK(t.taskId)} className="block">
                  <TaskCard
                    title={t.title}
                    status={t.status}
                    dueDate={t.dueDate ?? undefined}
                    assignee={t.assigneeUid ? "You" : undefined}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Missing documents */}
      <Section title="Missing documents">
        {data.missingDocuments.length === 0 ? (
          <EmptyState title="No missing documents" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.missingDocuments.map((m) => (
                  <li key={m.requirementId}>
                    <Link
                      href={ROUTES.STAFF_FAMILY(m.familyId)}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{m.templateName}</p>
                        <p className="text-xs text-muted-foreground">{m.familyName}</p>
                      </div>
                      <DocumentStatusChip status="missing" label="Missing" />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Reminders needing acknowledgment */}
      {data.remindersNeedingAck.length > 0 ? (
        <Section title="Reminders needing acknowledgment">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.remindersNeedingAck.map((r) => (
                  <li key={r.reminderId}>
                    <Link
                      href={
                        r.type === "document"
                          ? ROUTES.STAFF_FAMILY(r.familyId!)
                          : ROUTES.STAFF_TASK(r.targetId)
                      }
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">{r.title}</p>
                      <DueDateChip dueDate={r.dueAt.slice(0, 10)} showIcon={false} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Recently updated cases */}
      <Section title="Recently updated cases">
        {data.recentlyUpdatedCases.length === 0 ? (
          <EmptyState title="No recent case updates" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.recentlyUpdatedCases.map((c) => (
                  <li key={c.caseId}>
                    <Link
                      href={ROUTES.STAFF_FAMILY(c.familyId)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="text-sm font-medium">{c.familyName}</span>
                      <span className="text-xs text-muted-foreground">{c.stage}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Unresolved action prompts */}
      <Section
        title="Unresolved action prompts"
        action={
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={ROUTES.STAFF_REPORT}
          >
            Submit report
          </Link>
        }
      >
        {data.unresolvedActionPrompts.length === 0 ? (
          <EmptyState title="All caught up" description="No pending action prompts." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.unresolvedActionPrompts.map((p) => (
                  <li key={p.promptId}>
                    <Link
                      href={p.type === "report_due" ? ROUTES.STAFF_REPORT : ROUTES.STAFF_AGENDA}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{p.title}</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </Section>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
