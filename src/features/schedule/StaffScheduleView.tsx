"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ROUTES } from "@/constants";
import { useStaffScheduleRange } from "@/hooks/useSchedule";
import { fetchStaffFamilyOptions } from "@/services/firestore/weeklyPlanningService";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";
import { useAuth } from "@/hooks/useAuth";
import type { StaffFamilyOption } from "@/types/weeklyPlanning";
import type { ScheduleEntryView } from "@/types/schedule";
import { DayAgenda } from "@/features/schedule/DayAgenda";
import { WeekCalendar, WeekAgendaList } from "@/features/schedule/WeekCalendar";
import { ScheduleEntryForm } from "@/features/schedule/ScheduleEntryForm";
import {
  addDaysYmd,
  localDayBounds,
  toYmd,
  weekDaysFromStart,
  weekRangeIsoBounds,
  weekStartFromDate,
} from "@/lib/scheduleDateUtils";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

type Tab = "today" | "week";

export function StaffScheduleView() {
  const { orgId, user } = useAuth();
  const [tab, setTab] = useState<Tab>("today");
  const [dayYmd, setDayYmd] = useState(() => toYmd(new Date()));
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate());
  const [familyOptions, setFamilyOptions] = useState<StaffFamilyOption[]>([]);
  const [linkedStaffOptions, setLinkedStaffOptions] = useState<{ id: string; label: string }[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntryView | null>(null);

  const range = useMemo(() => {
    if (tab === "today") return localDayBounds(dayYmd);
    return weekRangeIsoBounds(weekStart);
  }, [tab, dayYmd, weekStart]);

  const { entries, isLoading, error, refetch, create, update, remove } = useStaffScheduleRange(
    range.startIso,
    range.endIso,
  );

  const loadOptions = useCallback(async () => {
    if (!orgId || !user?.uid) return;
    const [fams, seg] = await Promise.all([
      fetchStaffFamilyOptions(orgId, user.uid),
      fetchSegmentFilterOptions(orgId),
    ]);
    setFamilyOptions(fams);
    setLinkedStaffOptions(seg.staff.filter((s) => s.id !== user.uid));
  }, [orgId, user?.uid]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const todayEntries = useMemo(
    () => entries.filter((e) => e.date.slice(0, 10) === dayYmd).sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [entries, dayYmd],
  );

  const weekDays = useMemo(() => weekDaysFromStart(weekStart), [weekStart]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (e: ScheduleEntryView) => {
    setEditing(e);
    setSheetOpen(true);
  };

  if (!orgId || !user?.uid) {
    return <EmptyState title="Sign in required" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF}>
          Staff dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "today" ? "default" : "outline"} size="sm" onClick={() => setTab("today")}>
          Today
        </Button>
        <Button type="button" variant={tab === "week" ? "default" : "outline"} size="sm" onClick={() => setTab("week")}>
          This week
        </Button>
      </div>

      {tab === "today" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle>Today</CardTitle>
              <CardDescription>Your blocks for the selected day.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                value={dayYmd}
                onChange={(e) => setDayYmd(e.target.value)}
              />
              <Button type="button" size="sm" onClick={openCreate}>
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingState message="Loading…" /> : null}
            {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
            {!isLoading ? (
              <DayAgenda entries={todayEntries} onEdit={openEdit} onDelete={(id) => void remove(id)} />
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle>Week view</CardTitle>
              <CardDescription>Sunday–Saturday grid plus a detailed list on small screens.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart((w) => addDaysYmd(w, -7))}>
                Prev week
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(weekStartFromDate())}>
                This week
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart((w) => addDaysYmd(w, 7))}>
                Next week
              </Button>
              <Button type="button" size="sm" onClick={openCreate}>
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? <LoadingState message="Loading…" /> : null}
            {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
            {!isLoading ? (
              <>
                <div className="hidden lg:block">
                  <WeekCalendar
                    weekDaysYmd={weekDays}
                    entries={entries}
                    onEdit={openEdit}
                    onDelete={(id) => void remove(id)}
                  />
                </div>
                <WeekAgendaList
                  weekDaysYmd={weekDays}
                  entries={entries}
                  onEdit={openEdit}
                  onDelete={(id) => void remove(id)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit entry" : "New entry"}</SheetTitle>
            <SheetDescription>Times use your local timezone. Reserved fields support future Google Calendar sync.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ScheduleEntryForm
              initial={editing}
              familyOptions={familyOptions}
              linkedStaffOptions={linkedStaffOptions}
              onSubmit={async (input) => {
                if (editing) {
                  await update({ ...input, entryId: editing.entryId });
                } else {
                  await create(input);
                }
                setSheetOpen(false);
              }}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
