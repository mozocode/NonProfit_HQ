"use client";

import { Calendar } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type DueDateVariant = "default" | "soon" | "overdue" | "past";

export interface DueDateChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  dueDate: string;
  variant?: DueDateVariant;
  showIcon?: boolean;
}

function getVariant(dateStr: string): DueDateVariant {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "default";
}

const variantClasses: Record<DueDateVariant, string> = {
  default: "bg-muted text-muted-foreground",
  soon: "bg-status-warning-muted text-status-warning",
  overdue: "bg-status-error-muted text-status-error",
  past: "bg-status-neutral-muted text-status-neutral",
};

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

const DueDateChip = React.forwardRef<HTMLSpanElement, DueDateChipProps>(
  (
    { dueDate, variant: variantProp, showIcon = true, className, ...props },
    ref,
  ) => {
    const variant = variantProp ?? getVariant(dueDate);
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
          variantClasses[variant],
          className,
        )}
        title={dueDate}
        {...props}
      >
        {showIcon ? <Calendar className="size-3 shrink-0" aria-hidden /> : null}
        {formatDueDate(dueDate)}
      </span>
    );
  },
);
DueDateChip.displayName = "DueDateChip";

export { DueDateChip };
