"use client";

import { Badge } from "@/components/ui/badge";
import type { ReferralStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ReferralStatus, string> = {
  suggested: "Suggested",
  referred: "Referred",
  connected: "Connected",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_VARIANTS: Record<ReferralStatus, "secondary" | "default" | "outline" | "destructive"> = {
  suggested: "secondary",
  referred: "outline",
  connected: "outline",
  in_progress: "default",
  completed: "secondary",
};

export interface ReferralStatusChipProps {
  status: ReferralStatus;
  className?: string;
}

export function ReferralStatusChip({ status, className }: ReferralStatusChipProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={cn("capitalize", className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
