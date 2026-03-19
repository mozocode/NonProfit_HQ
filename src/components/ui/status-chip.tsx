"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        active: "bg-status-success-muted text-status-success",
        inactive: "bg-status-neutral-muted text-status-neutral",
        pending: "bg-status-warning-muted text-status-warning",
        completed: "bg-status-success-muted text-status-success",
        draft: "bg-status-neutral-muted text-status-neutral",
        submitted: "bg-status-info-muted text-status-info",
        approved: "bg-status-success-muted text-status-success",
        rejected: "bg-status-error-muted text-status-error",
        overdue: "bg-status-error-muted text-status-error",
      },
    },
    defaultVariants: {
      status: "active",
    },
  },
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusChipVariants> {
  label?: string;
}

const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  ({ status, label, className, children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(statusChipVariants({ status }), className)}
      {...props}
    >
      {children ?? label}
    </span>
  ),
);
StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };
