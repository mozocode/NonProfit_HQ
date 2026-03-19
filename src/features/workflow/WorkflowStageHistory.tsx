"use client";

import { TimelineItem } from "@/components/ui/timeline-item";
import type { StageHistoryEntry } from "@/types/workflow";
import { getStageLabel } from "@/lib/workflowUtils";

export interface WorkflowStageHistoryProps {
  entries: StageHistoryEntry[];
  className?: string;
}

export function WorkflowStageHistory({ entries, className }: WorkflowStageHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No stage history yet.</p>
    );
  }
  const reversed = [...entries].reverse();
  return (
    <ul className={className}>
      {reversed.map((entry, i) => (
        <li key={`${entry.stage}-${entry.enteredAt}-${i}`}>
          <TimelineItem
            title={getStageLabel(entry.stage)}
            description={entry.note ?? undefined}
            timestamp={entry.enteredAt}
            isLast={i === reversed.length - 1}
          />
        </li>
      ))}
    </ul>
  );
}
