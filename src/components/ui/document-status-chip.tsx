"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { FileCheck, FileQuestion, FileX } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const documentStatusChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        missing: "bg-status-error-muted text-status-error",
        uploaded: "bg-status-warning-muted text-status-warning",
        approved: "bg-status-success-muted text-status-success",
        rejected: "bg-status-error-muted text-status-error",
      },
    },
    defaultVariants: {
      status: "missing",
    },
  },
);

const statusIcons: Record<"missing" | "uploaded" | "approved" | "rejected", React.ReactNode> = {
  missing: <FileQuestion className="size-3 shrink-0" aria-hidden />,
  uploaded: <FileCheck className="size-3 shrink-0" aria-hidden />,
  approved: <FileCheck className="size-3 shrink-0" aria-hidden />,
  rejected: <FileX className="size-3 shrink-0" aria-hidden />,
};

export interface DocumentStatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof documentStatusChipVariants> {
  label?: string;
  showIcon?: boolean;
}

const DocumentStatusChip = React.forwardRef<HTMLSpanElement, DocumentStatusChipProps>(
  ({ status = "missing", label, showIcon = true, className, children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(documentStatusChipVariants({ status }), className)}
      {...props}
    >
      {showIcon ? statusIcons[status ?? "missing"] : null}
      {children ?? label ?? status}
    </span>
  ),
);
DocumentStatusChip.displayName = "DocumentStatusChip";

export { DocumentStatusChip, documentStatusChipVariants };
