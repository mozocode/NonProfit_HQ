"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { TimelineItem } from "@/components/ui/timeline-item";
import type { FamilyProfileData } from "@/types/familyProfile";
import type { TimelineEntryView } from "@/types/notesInteractions";
import { History } from "lucide-react";

export interface TimelineTabProps {
  data: FamilyProfileData;
  /** When provided, show merged notes + interactions timeline instead of mock. */
  entriesFromHook?: TimelineEntryView[] | null;
  isLoading?: boolean;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TimelineTab({ data, entriesFromHook, isLoading }: TimelineTabProps) {
  const useRealTimeline = entriesFromHook != null;
  const entries = useRealTimeline ? entriesFromHook : data.timeline;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading timeline…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-10" />}
        title="No timeline activity"
        description="Interactions, notes, and document activity will appear here."
      />
    );
  }
  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <TimelineItem
          key={entry.id}
          title={entry.title}
          description={entry.description ?? undefined}
          timestamp={formatTimestamp(entry.timestamp)}
          isLast={index === entries.length - 1}
        />
      ))}
    </div>
  );
}
