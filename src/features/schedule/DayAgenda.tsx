"use client";

import { MapPin, StickyNote, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/scheduleDateUtils";
import type { ScheduleEntryView } from "@/types/schedule";
import { cn } from "@/lib/utils";

export function DayAgenda({
  entries,
  showStaffLabel,
  onEdit,
  onDelete,
  readOnly,
}: {
  entries: ScheduleEntryView[];
  showStaffLabel?: boolean;
  onEdit?: (e: ScheduleEntryView) => void;
  onDelete?: (entryId: string) => void;
  readOnly?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing on the calendar for this day.</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.entryId}
          className={cn(
            "rounded-lg border bg-card p-4 shadow-sm",
            e.type === "leave" && "border-dashed opacity-90",
            e.type === "meeting" && "border-l-4 border-l-primary",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatTimeRange(e.startAt, e.endAt)} · {e.type}
              </p>
              <p className="text-base font-semibold">{e.title || "Untitled block"}</p>
              {showStaffLabel ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="size-3.5" />
                  {e.primaryStaffLabel ?? e.staffUid}
                </p>
              ) : null}
            </div>
            {!readOnly && (onEdit || onDelete) ? (
              <div className="flex gap-1">
                {onEdit ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(e)}>
                    Edit
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(e.entryId)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {e.location ? (
              <p className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {e.location}
              </p>
            ) : null}
            {e.familyLabel ? (
              <p className="flex items-center gap-1">
                <Users className="size-3.5 shrink-0" />
                Family: {e.familyLabel}
              </p>
            ) : null}
            {e.caseId ? <p>Case: {e.caseId}</p> : null}
            {e.linkedStaffLabel ? (
              <p className="flex items-center gap-1">
                <User className="size-3.5 shrink-0" />
                With: {e.linkedStaffLabel}
              </p>
            ) : null}
            {e.notes ? (
              <p className="flex items-start gap-1">
                <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                {e.notes}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
