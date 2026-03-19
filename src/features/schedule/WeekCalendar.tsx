"use client";

import { DayAgenda } from "@/features/schedule/DayAgenda";
import { formatWeekdayShort, toYmd } from "@/lib/scheduleDateUtils";
import type { ScheduleEntryView } from "@/types/schedule";
import { cn } from "@/lib/utils";

export function WeekCalendar({
  weekDaysYmd,
  entries,
  showStaffLabel,
  onEdit,
  onDelete,
  readOnly,
}: {
  weekDaysYmd: string[];
  entries: ScheduleEntryView[];
  showStaffLabel?: boolean;
  onEdit?: (e: ScheduleEntryView) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}) {
  const byDay = new Map<string, ScheduleEntryView[]>();
  weekDaysYmd.forEach((d) => byDay.set(d, []));
  entries.forEach((e) => {
    const key = e.date.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  });
  byDay.forEach((list) => list.sort((a, b) => a.startAt.localeCompare(b.startAt)));

  return (
    <div className="grid gap-3 lg:grid-cols-7">
      {weekDaysYmd.map((ymd) => {
        const list = byDay.get(ymd) ?? [];
        const isToday = ymd === toYmd(new Date());
        return (
          <div
            key={ymd}
            className={cn(
              "min-h-[220px] rounded-lg border bg-muted/20 p-2 lg:min-h-[280px]",
              isToday && "ring-2 ring-primary/40",
            )}
          >
            <p className="mb-2 border-b pb-1 text-center text-xs font-semibold text-foreground">{formatWeekdayShort(ymd)}</p>
            <p className="mb-2 text-center text-[10px] text-muted-foreground">{ymd}</p>
            <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {list.length === 0 ? (
                <p className="px-1 text-center text-[11px] text-muted-foreground">—</p>
              ) : (
                list.map((e) => (
                  <div
                    key={e.entryId}
                    className={cn(
                      "rounded border bg-card p-2 text-xs shadow-sm",
                      e.type === "meeting" && "border-l-2 border-l-primary",
                      e.type === "leave" && "opacity-80",
                    )}
                  >
                    <p className="font-medium leading-tight">{e.title || e.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(e.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                    {e.location ? <p className="truncate text-[10px] text-muted-foreground">{e.location}</p> : null}
                    {showStaffLabel ? (
                      <p className="truncate text-[10px]">{e.primaryStaffLabel ?? e.staffUid}</p>
                    ) : null}
                    {!readOnly && (onEdit || onDelete) ? (
                      <div className="mt-1 flex gap-1">
                        {onEdit ? (
                          <button
                            type="button"
                            className="text-[10px] font-medium text-primary underline"
                            onClick={() => onEdit(e)}
                          >
                            Edit
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            className="text-[10px] font-medium text-destructive underline"
                            onClick={() => onDelete(e.entryId)}
                          >
                            Del
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Full agenda list per day below the grid (mobile-friendly detail). */
export function WeekAgendaList({
  weekDaysYmd,
  entries,
  showStaffLabel,
  onEdit,
  onDelete,
  readOnly,
}: {
  weekDaysYmd: string[];
  entries: ScheduleEntryView[];
  showStaffLabel?: boolean;
  onEdit?: (e: ScheduleEntryView) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}) {
  const byDay = new Map<string, ScheduleEntryView[]>();
  weekDaysYmd.forEach((d) => byDay.set(d, []));
  entries.forEach((e) => {
    const key = e.date.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  });
  return (
    <div className="space-y-6 lg:hidden">
      {weekDaysYmd.map((ymd) => (
        <div key={ymd}>
          <h3 className="mb-2 text-sm font-semibold">
            {formatWeekdayShort(ymd)} <span className="text-muted-foreground">({ymd})</span>
          </h3>
          <DayAgenda
            entries={(byDay.get(ymd) ?? []).sort((a, b) => a.startAt.localeCompare(b.startAt))}
            showStaffLabel={showStaffLabel}
            onEdit={onEdit}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}
