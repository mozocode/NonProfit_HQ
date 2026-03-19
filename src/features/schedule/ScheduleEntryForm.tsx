"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isoToLocalHm } from "@/lib/scheduleDateUtils";
import type { StaffFamilyOption } from "@/types/weeklyPlanning";
import type { CreateScheduleEntryInput, ScheduleEntryView } from "@/types/schedule";
import type { StaffScheduleEntry } from "@/types/domain";

const typeOptions: { value: StaffScheduleEntry["type"]; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "meeting", label: "Meeting" },
  { value: "leave", label: "Leave" },
];

export function entryToFormInput(e: ScheduleEntryView): CreateScheduleEntryInput {
  return {
    date: e.date.slice(0, 10),
    startTime: isoToLocalHm(e.startAt),
    endTime: isoToLocalHm(e.endAt),
    title: e.title ?? "",
    location: e.location,
    type: e.type,
    familyId: e.familyId,
    caseId: e.caseId,
    linkedStaffUid: e.linkedStaffUid,
    notes: e.notes,
  };
}

export function ScheduleEntryForm({
  initial,
  familyOptions,
  linkedStaffOptions,
  ownerStaffOptions,
  showOwnerSelect,
  selectedOwnerUid,
  onOwnerChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: ScheduleEntryView | null;
  familyOptions: StaffFamilyOption[];
  linkedStaffOptions: { id: string; label: string }[];
  ownerStaffOptions?: { id: string; label: string }[];
  showOwnerSelect?: boolean;
  selectedOwnerUid?: string;
  onOwnerChange?: (uid: string) => void;
  onSubmit: (input: CreateScheduleEntryInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<StaffScheduleEntry["type"]>("work");
  const [familyId, setFamilyId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [linkedStaffUid, setLinkedStaffUid] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      const f = entryToFormInput(initial);
      setDate(f.date);
      setStartTime(f.startTime);
      setEndTime(f.endTime);
      setTitle(f.title);
      setLocation(f.location ?? "");
      setType(f.type);
      setFamilyId(f.familyId ?? "");
      setCaseId(f.caseId ?? "");
      setLinkedStaffUid(f.linkedStaffUid ?? "");
      setNotes(f.notes ?? "");
    } else {
      const t = new Date();
      const y = t.getFullYear();
      const m = String(t.getMonth() + 1).padStart(2, "0");
      const d = String(t.getDate()).padStart(2, "0");
      setDate(`${y}-${m}-${d}`);
      setStartTime("09:00");
      setEndTime("10:00");
      setTitle("");
      setLocation("");
      setType("work");
      setFamilyId("");
      setCaseId("");
      setLinkedStaffUid("");
      setNotes("");
    }
  }, [initial]);

  const famOpts = [{ value: "", label: "— None —" }, ...familyOptions.map((f) => ({ value: f.familyId, label: f.label }))];
  const linkOpts = [{ value: "", label: "— None —" }, ...linkedStaffOptions.map((s) => ({ value: s.id, label: s.label }))];
  const ownerOpts = ownerStaffOptions?.map((s) => ({ value: s.id, label: s.label })) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        title,
        location: location.trim() || null,
        type,
        familyId: familyId || null,
        caseId: caseId.trim() || null,
        linkedStaffUid: linkedStaffUid || null,
        notes: notes.trim() || null,
      });
      onCancel?.();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-4">
      {showOwnerSelect && ownerOpts.length > 0 ? (
        <div className="space-y-2">
          <Label>Staff member</Label>
          <Select
            options={ownerOpts}
            value={selectedOwnerUid ?? ""}
            onChange={(ev) => onOwnerChange?.(ev.target.value)}
          />
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(ev) => setDate(ev.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
            value={type}
            onChange={(ev) => setType(ev.target.value as StaffScheduleEntry["type"])}
          />
        </div>
        <div className="space-y-2">
          <Label>Start</Label>
          <Input type="time" value={startTime} onChange={(ev) => setStartTime(ev.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>End</Label>
          <Input type="time" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="What’s on the calendar?" required />
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="Office, address, virtual…" />
      </div>
      <div className="space-y-2">
        <Label>Linked family</Label>
        <Select options={famOpts} value={familyId} onChange={(ev) => setFamilyId(ev.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Case ID (optional)</Label>
        <Input value={caseId} onChange={(ev) => setCaseId(ev.target.value)} placeholder="Internal case reference" />
      </div>
      <div className="space-y-2">
        <Label>Linked staff member</Label>
        <Select options={linkOpts} value={linkedStaffUid} onChange={(ev) => setLinkedStaffUid(ev.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(ev) => setNotes(ev.target.value)} rows={3} />
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={busy}>
          {submitLabel ?? (initial ? "Save" : "Create")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        External calendar sync is not enabled yet — <code className="rounded bg-muted px-1">syncSource</code> stays{" "}
        <code className="rounded bg-muted px-1">local</code>.
      </p>
    </form>
  );
}
