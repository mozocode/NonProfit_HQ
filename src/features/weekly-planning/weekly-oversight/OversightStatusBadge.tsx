"use client";

import type { WeeklyOversightStatus } from "@/types/weeklyOversight";
import { cn } from "@/lib/utils";

const styles: Record<WeeklyOversightStatus, string> = {
  on_track: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  partially_completed: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  missing_report: "bg-destructive/15 text-destructive",
  needs_review: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
};

const labels: Record<WeeklyOversightStatus, string> = {
  on_track: "On track",
  partially_completed: "Partially completed",
  missing_report: "Missing report",
  needs_review: "Needs review",
};

export function OversightStatusBadge({ status }: { status: WeeklyOversightStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {labels[status]}
    </span>
  );
}
