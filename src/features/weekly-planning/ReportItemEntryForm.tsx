"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { REPORT_CATEGORY_LABELS } from "@/lib/weeklyPlanningUtils";
import type { StaffReportItem } from "@/types/domain";
import type { StaffFamilyOption } from "@/types/weeklyPlanning";

const categoryOptions = Object.entries(REPORT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export interface ReportItemEntryFormProps {
  item?: StaffReportItem | null;
  familyOptions: StaffFamilyOption[];
  onSave: (payload: {
    itemId?: string;
    activityDescription: string;
    familyId: string | null;
    location: string | null;
    category: string;
    hoursSpent: number;
    notes: string | null;
  }) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  disabled?: boolean;
}

export function ReportItemEntryForm({
  item,
  familyOptions,
  onSave,
  onDelete,
  disabled,
}: ReportItemEntryFormProps) {
  const [activityDescription, setActivityDescription] = useState(item?.activityDescription ?? "");
  const [familyId, setFamilyId] = useState(item?.familyId ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [category, setCategory] = useState(item?.category ?? "other");
  const [hoursSpent, setHoursSpent] = useState(String(item?.hoursSpent ?? ""));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActivityDescription(item?.activityDescription ?? "");
    setFamilyId(item?.familyId ?? "");
    setLocation(item?.location ?? "");
    setCategory(item?.category ?? "other");
    setHoursSpent(item?.hoursSpent != null ? String(item.hoursSpent) : "");
    setNotes(item?.notes ?? "");
  }, [item?.itemId, item?.updatedAt]);

  const familySelectOptions = [
    { value: "", label: "— None —" },
    ...familyOptions.map((f) => ({ value: f.familyId, label: f.label })),
  ];

  const handleSave = async () => {
    const hours = Number(hoursSpent);
    if (Number.isNaN(hours) || hours < 0) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        itemId: item?.itemId,
        activityDescription: activityDescription.trim(),
        familyId: familyId || null,
        location: location.trim() || null,
        category,
        hoursSpent: hours,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1">
          <Label>Completed activity</Label>
          <Textarea
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="What did you complete?"
          />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label>Hours spent</Label>
          <Input
            type="number"
            min={0}
            step={0.25}
            value={hoursSpent}
            onChange={(e) => setHoursSpent(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label>Linked family / case</Label>
          <Select
            options={familySelectOptions}
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={disabled}
            placeholder="Office, school site, virtual…"
          />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled}
            rows={2}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={disabled || saving} onClick={() => void handleSave()}>
          {item ? "Update activity" : "Save activity"}
        </Button>
        {item && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled || saving}
            onClick={() => void onDelete(item.itemId)}
          >
            <Trash2 className="mr-1 size-4" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
