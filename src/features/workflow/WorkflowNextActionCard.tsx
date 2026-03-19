"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import type { WorkflowNextAction } from "@/types/workflow";
import { cn } from "@/lib/utils";

export interface WorkflowNextActionCardProps {
  nextAction: WorkflowNextAction | null;
  isOverdue: boolean;
  className?: string;
}

export function WorkflowNextActionCard({ nextAction, isOverdue, className }: WorkflowNextActionCardProps) {
  if (!nextAction) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">No required action right now.</p>
        </CardContent>
      </Card>
    );
  }

  const href =
    nextAction.type === "task"
      ? ROUTES.STAFF_TASK(nextAction.id)
      : ROUTES.STAFF_FAMILY(nextAction.familyId);

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "transition-colors hover:bg-muted/50",
          isOverdue && "border-status-error/50 bg-status-error-muted/30",
          !isOverdue && "border-status-warning/40 bg-status-warning-muted/30",
          className,
        )}
      >
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle
            className={cn("size-5 shrink-0", isOverdue ? "text-status-error" : "text-status-warning")}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isOverdue ? "Overdue" : "Next action"}
            </p>
            <p className="font-medium text-foreground">{nextAction.title}</p>
            {nextAction.dueDate ? (
              <p className="text-sm text-muted-foreground">
                Due {new Date(nextAction.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
