"use client";

import { CheckSquare, Square } from "lucide-react";
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DueDateVariant } from "@/components/ui/due-date-chip";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { StatusChip } from "@/components/ui/status-chip";

export interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done" | "blocked";
  dueDate?: string;
  dueDateVariant?: DueDateVariant;
  assignee?: string;
  onClick?: () => void;
}

const statusMap = {
  todo: "pending",
  in_progress: "active",
  done: "completed",
  blocked: "inactive",
} as const;

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  (
    {
      title,
      description,
      status = "todo",
      dueDate,
      dueDateVariant,
      assignee,
      onClick,
      className,
      ...props
    },
    ref,
  ) => (
    <Card
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "overflow-hidden transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      {...props}
    >
      <CardContent className="flex gap-3 p-4">
        <span className="shrink-0 pt-0.5 text-muted-foreground" aria-hidden>
          {status === "done" ? (
            <CheckSquare className="size-4 text-status-success" />
          ) : (
            <Square className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusChip status={statusMap[status]} />
            {dueDate ? (
              <DueDateChip dueDate={dueDate} variant={dueDateVariant} />
            ) : null}
            {assignee ? (
              <span className="text-xs text-muted-foreground">{assignee}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  ),
);
TaskCard.displayName = "TaskCard";

export { TaskCard };
