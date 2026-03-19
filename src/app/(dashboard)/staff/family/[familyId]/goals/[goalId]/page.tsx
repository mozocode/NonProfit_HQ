"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatusChip } from "@/components/ui/status-chip";
import { ROUTES } from "@/constants";
import { useGoal } from "@/hooks/useGoal";
import { TaskCard } from "@/components/ui/task-card";
import { Badge } from "@/components/ui/badge";

const GOAL_TYPE_LABEL: Record<string, string> = {
  long_term: "Long-term",
  short_term: "Short-term",
};

export default function StaffFamilyGoalPage() {
  const params = useParams();
  const familyId = params?.familyId as string | null;
  const goalId = params?.goalId as string | null;
  const { goal, tasks, isLoading, error, refetch } = useGoal(familyId, goalId);

  if (!familyId || !goalId) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Missing family or goal.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading goal…" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!goal) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(familyId)}>
          Back to family
        </Link>
        <p className="text-sm text-muted-foreground">Goal not found.</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress");

  return (
    <div className="space-y-6">
      <PageHeader
        title={goal.title}
        description={goal.description ?? undefined}
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(familyId)}>
            Back to family profile
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{GOAL_TYPE_LABEL[goal.goalType] ?? goal.goalType}</Badge>
        <StatusChip
          status={goal.status === "active" ? "active" : goal.status === "completed" ? "completed" : "inactive"}
          label={goal.status}
        />
        {goal.targetDate ? (
          <span className="text-sm text-muted-foreground">
            Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        ) : null}
      </div>

      <Section
        title="Tasks"
        description={`${tasks.length} task(s). ${pendingTasks.length} pending.`}
        action={
          <Link
            className={buttonVariants({ size: "sm" })}
            href={`${ROUTES.STAFF_FAMILY_GOAL(familyId, goalId)}/task/new`}
          >
            Add task
          </Link>
        }
      >
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Add a task to get started.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tasks.map((t) => (
              <li key={t.taskId}>
                <Link href={ROUTES.STAFF_TASK(t.taskId)} className="block">
                  <TaskCard
                    title={t.title}
                    description={t.description ?? undefined}
                    status={t.status}
                    dueDate={t.dueDate ?? undefined}
                    assignee={t.assigneeType ? `${t.assigneeType}: ${t.assigneeId ?? "—"}` : undefined}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
