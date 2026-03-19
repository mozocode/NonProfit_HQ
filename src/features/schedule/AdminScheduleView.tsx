"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useAdminScheduleRange, useAdminStaffDaySummary } from "@/hooks/useSchedule";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";
import { seedDemoScheduleData } from "@/services/firestore/scheduleSeedDemo";
import { fetchStaffFamilyOptions } from "@/services/firestore/weeklyPlanningService";
import { DayAgenda } from "@/features/schedule/DayAgenda";
import { ScheduleEntryForm } from "@/features/schedule/ScheduleEntryForm";
import { WeekAgendaList, WeekCalendar } from "@/features/schedule/WeekCalendar";
import {
  addDaysYmd,
  localDayBounds,
  toYmd,
  weekDaysFromStart,
  weekRangeIsoBounds,
  weekStartFromDate,
} from "@/lib/scheduleDateUtils";
import type { StaffFamilyOption } from "@/types/weeklyPlanning";
import type { ScheduleEntryView } from "@/types/schedule";

type AdminMode = "org_day" | "org_week" | "staff_week";

type StaffDayOverviewRow = {
  staffUid: string;
  staffLabel: string;
  location: string | null;
  summary: string;
  blocks: ScheduleEntryView[];
};

function mergeStaffDayRows(directoryStaff: { id: string; label: string }[], summaryRows: StaffDayOverviewRow[]): StaffDayOverviewRow[] {
  const byUid = new Map(summaryRows.map((r) => [r.staffUid, r]));
  const seen = new Set<string>();
  const out: StaffDayOverviewRow[] = [];

  for (const s of directoryStaff) {
    seen.add(s.id);
    const r = byUid.get(s.id);
    if (r) {
      out.push(r);
    } else {
      out.push({
        staffUid: s.id,
        staffLabel: s.label,
        location: null,
        summary: "No entries",
        blocks: [],
      });
    }
  }
  for (const r of summaryRows) {
    if (!seen.has(r.staffUid)) {
      out.push(r);
    }
  }
  return out;
}

export function AdminScheduleView() {
  const { orgId, user } = useAuth();
  const [mode, setMode] = useState<AdminMode>("org_day");
  const [orgDayYmd, setOrgDayYmd] = useState(() => toYmd(new Date()));
  const [summaryDayYmd, setSummaryDayYmd] = useState(() => toYmd(new Date()));
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate());
  const [staffFilter, setStaffFilter] = useState(""); // all = ""
  const [staffFocus, setStaffFocus] = useState("");
  const [ownerStaffOptions, setOwnerStaffOptions] = useState<{ id: string; label: string }[]>([]);
  const [createOwnerUid, setCreateOwnerUid] = useState("");
  const [familyOptions, setFamilyOptions] = useState<StaffFamilyOption[]>([]);
  const [seedBusy, setSeedBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntryView | null>(null);

  const range = useMemo(() => {
    if (mode === "org_day") return localDayBounds(orgDayYmd);
    return weekRangeIsoBounds(weekStart);
  }, [mode, orgDayYmd, weekStart]);

  const staffUidForQuery =
    mode === "staff_week" ? (staffFocus || undefined) : staffFilter || undefined;
  const rangeQueryEnabled = mode !== "staff_week" || Boolean(staffFocus);

  const { entries, isLoading, error, refetch, createForStaff, updateAny, removeAny } = useAdminScheduleRange(
    range.startIso,
    range.endIso,
    { staffUid: staffUidForQuery, enabled: rangeQueryEnabled },
  );

  const {
    rows: summaryRows,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useAdminStaffDaySummary(summaryDayYmd);

  const loadDirectory = useCallback(async () => {
    if (!orgId) return;
    const seg = await fetchSegmentFilterOptions(orgId);
    setOwnerStaffOptions(seg.staff);
  }, [orgId]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (ownerStaffOptions.length === 0) return;
    if (!createOwnerUid || !ownerStaffOptions.some((o) => o.id === createOwnerUid)) {
      setCreateOwnerUid(ownerStaffOptions[0]!.id);
    }
  }, [ownerStaffOptions, createOwnerUid]);

  const familyScopeUid = editing?.staffUid ?? createOwnerUid;

  const loadFamilies = useCallback(async () => {
    if (!orgId || !familyScopeUid) return;
    setFamilyOptions(await fetchStaffFamilyOptions(orgId, familyScopeUid));
  }, [orgId, familyScopeUid]);

  useEffect(() => {
    void loadFamilies();
  }, [loadFamilies]);

  const linkedStaffOptions = useMemo(() => {
    const owner = editing?.staffUid ?? createOwnerUid;
    return ownerStaffOptions.filter((s) => s.id !== owner);
  }, [ownerStaffOptions, createOwnerUid, editing?.staffUid]);

  const weekDays = useMemo(() => weekDaysFromStart(weekStart), [weekStart]);

  const mergedOverview = useMemo(
    () => mergeStaffDayRows(ownerStaffOptions, summaryRows),
    [ownerStaffOptions, summaryRows],
  );

  const orgDayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.date.slice(0, 10) === orgDayYmd)
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [entries, orgDayYmd],
  );

  const openCreate = () => {
    setEditing(null);
    if (mode === "staff_week" && staffFocus) {
      setCreateOwnerUid(staffFocus);
    }
    setSheetOpen(true);
  };

  const openEdit = (e: ScheduleEntryView) => {
    setEditing(e);
    setSheetOpen(true);
  };

  const onSeed = async () => {
    if (!orgId || ownerStaffOptions.length === 0) return;
    setSeedBusy(true);
    try {
      const staffUids = ownerStaffOptions.slice(0, 2).map((s) => s.id);
      await seedDemoScheduleData(orgId, staffUids);
      await Promise.all([refetch(), refetchSummary()]);
    } finally {
      setSeedBusy(false);
    }
  };

  if (!orgId) {
    return <EmptyState title="Organization required" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
          Admin dashboard
        </Link>
        <Button type="button" variant="outline" size="sm" disabled={seedBusy || ownerStaffOptions.length === 0} onClick={() => void onSeed()}>
          {seedBusy ? "Seeding…" : "Seed demo schedule"}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
          <div>
            <CardTitle>Staff — where & what</CardTitle>
            <CardDescription>Per staff for the selected day: primary location signal and activity summary.</CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="summary-day" className="text-xs text-muted-foreground">
              Overview date
            </Label>
            <input
              id="summary-day"
              type="date"
              className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
              value={summaryDayYmd}
              onChange={(e) => setSummaryDayYmd(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? <LoadingState message="Loading overview…" /> : null}
          {summaryError ? <p className="text-sm text-destructive">{summaryError.message}</p> : null}
          {!summaryLoading && ownerStaffOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff directory rows — add staff to see the full roster.</p>
          ) : null}
          {!summaryLoading && ownerStaffOptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Where (today)</TableHead>
                  <TableHead>What (today)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedOverview.map((row) => (
                  <TableRow key={row.staffUid}>
                    <TableCell className="font-medium">{row.staffLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{row.location ?? "—"}</TableCell>
                    <TableCell>{row.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={mode === "org_day" ? "default" : "outline"} size="sm" onClick={() => setMode("org_day")}>
          Org day
        </Button>
        <Button type="button" variant={mode === "org_week" ? "default" : "outline"} size="sm" onClick={() => setMode("org_week")}>
          Org week
        </Button>
        <Button type="button" variant={mode === "staff_week" ? "default" : "outline"} size="sm" onClick={() => setMode("staff_week")}>
          Staff week
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/20 p-4">
        {(mode === "org_day" || mode === "org_week") && ownerStaffOptions.length > 0 ? (
          <div className="flex min-w-[200px] flex-col gap-1">
            <Label htmlFor="staff-filter">Filter by staff</Label>
            <select
              id="staff-filter"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="">All staff</option>
              {ownerStaffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {mode === "staff_week" ? (
          <div className="flex min-w-[220px] flex-col gap-1">
            <Label htmlFor="staff-focus">Staff member</Label>
            <select
              id="staff-focus"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={staffFocus}
              onChange={(e) => setStaffFocus(e.target.value)}
            >
              <option value="">Select…</option>
              {ownerStaffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {mode === "org_day" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle>Organization day</CardTitle>
              <CardDescription>All scheduled blocks for the selected day.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOrgDayYmd((d) => addDaysYmd(d, -1))}>
                Prev day
              </Button>
              <input
                type="date"
                className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                value={orgDayYmd}
                onChange={(e) => setOrgDayYmd(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setOrgDayYmd(toYmd(new Date()))}>
                Today
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setOrgDayYmd((d) => addDaysYmd(d, 1))}>
                Next day
              </Button>
              <Button type="button" size="sm" onClick={openCreate}>
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingState message="Loading…" /> : null}
            {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
            {!isLoading ? (
              <DayAgenda
                entries={orgDayEntries}
                showStaffLabel
                onEdit={openEdit}
                onDelete={(id) => void removeAny(id)}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {mode === "org_week" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle>Organization week</CardTitle>
              <CardDescription>Sunday–Saturday for everyone (optionally filtered to one staff member).</CardDescription>
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
                    showStaffLabel
                    onEdit={openEdit}
                    onDelete={(id) => void removeAny(id)}
                  />
                </div>
                <WeekAgendaList
                  weekDaysYmd={weekDays}
                  entries={entries}
                  showStaffLabel
                  onEdit={openEdit}
                  onDelete={(id) => void removeAny(id)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {mode === "staff_week" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle>Per-staff week</CardTitle>
              <CardDescription>Choose a staff member to see their week.</CardDescription>
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
              <Button type="button" size="sm" disabled={!staffFocus} onClick={openCreate}>
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!staffFocus ? (
              <p className="text-sm text-muted-foreground">Select a staff member above to load their calendar.</p>
            ) : null}
            {staffFocus && isLoading ? <LoadingState message="Loading…" /> : null}
            {staffFocus && error ? <p className="text-sm text-destructive">{error.message}</p> : null}
            {staffFocus && !isLoading ? (
              <>
                <div className="hidden lg:block">
                  <WeekCalendar
                    weekDaysYmd={weekDays}
                    entries={entries}
                    onEdit={openEdit}
                    onDelete={(id) => void removeAny(id)}
                  />
                </div>
                <WeekAgendaList
                  weekDaysYmd={weekDays}
                  entries={entries}
                  onEdit={openEdit}
                  onDelete={(id) => void removeAny(id)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit entry" : "New entry"}</SheetTitle>
            <SheetDescription>
              Admin can assign the owner. Reserved sync fields support future Google Calendar integration (not active yet).
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ScheduleEntryForm
              initial={editing}
              familyOptions={familyOptions}
              linkedStaffOptions={linkedStaffOptions}
              ownerStaffOptions={ownerStaffOptions}
              showOwnerSelect={!editing}
              selectedOwnerUid={createOwnerUid}
              onOwnerChange={setCreateOwnerUid}
              onSubmit={async (input) => {
                if (editing) {
                  await updateAny({ ...input, entryId: editing.entryId });
                } else {
                  const owner = createOwnerUid || user?.uid;
                  if (!owner) throw new Error("Select a staff owner");
                  await createForStaff(owner, input);
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
