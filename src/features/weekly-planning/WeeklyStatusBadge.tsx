"use client";

import type { WeeklySubmissionStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const styles: Record<WeeklySubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  overdue: "bg-destructive/15 text-destructive",
  reviewed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
};

const labels: Record<WeeklySubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  overdue: "Overdue",
  reviewed: "Reviewed",
};

export function WeeklyStatusBadge({ status }: { status: WeeklySubmissionStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", styles[status])}>
      {labels[status]}
    </span>
  );
}
