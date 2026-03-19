"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { ROUTES } from "@/constants";
import type { FamilyProfileData } from "@/types/familyProfile";
import { Target } from "lucide-react";

const GOAL_TYPE_LABEL: Record<string, string> = {
  long_term: "Long-term",
  short_term: "Short-term",
};

export interface GoalsTabProps {
  data: FamilyProfileData;
}

export function GoalsTab({ data }: GoalsTabProps) {
  const { goals, summary } = data;
  const familyId = summary.familyId;

  if (goals.length === 0) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ size: "sm" })} href={ROUTES.STAFF_FAMILY_GOAL_NEW(familyId)}>
          Add goal
        </Link>
        <EmptyState
          icon={<Target className="size-10" />}
          title="No goals yet"
          description="Add goals for this family from the case plan."
        />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link className={buttonVariants({ size: "sm" })} href={ROUTES.STAFF_FAMILY_GOAL_NEW(familyId)}>
          Add goal
        </Link>
      </div>
      <ul className="space-y-4">
      {goals.map((goal) => (
        <li key={goal.goalId}>
          <Link href={ROUTES.STAFF_FAMILY_GOAL(familyId, goal.goalId)} className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{goal.title}</h3>
                  <Badge variant="secondary">{GOAL_TYPE_LABEL[goal.goalType] ?? goal.goalType}</Badge>
                </div>
                <StatusChip
                  status={
                    goal.status === "active"
                      ? "active"
                      : goal.status === "completed"
                        ? "completed"
                        : "inactive"
                  }
                  label={goal.status}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {goal.description ? (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {goal.targetDate ? (
                    <span>
                      Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  ) : null}
                  {goal.tasksCount != null ? (
                    <span>{goal.tasksCount} task(s)</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
      </ul>
    </div>
  );
}
