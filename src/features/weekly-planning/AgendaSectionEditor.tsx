"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { AgendaLineItem } from "@/types/domain";
import type { StaffFamilyOption } from "@/types/weeklyPlanning";

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tmp_${Date.now()}_${Math.random()}`;
}

export interface AgendaSectionEditorProps {
  title: string;
  description?: string;
  items: AgendaLineItem[];
  onChange: (items: AgendaLineItem[]) => void;
  familyOptions: StaffFamilyOption[];
  showFamily?: boolean;
  showScheduledAt?: boolean;
  showDueAt?: boolean;
  disabled?: boolean;
}

export function AgendaSectionEditor({
  title,
  description,
  items,
  onChange,
  familyOptions,
  showFamily,
  showScheduledAt,
  showDueAt,
  disabled,
}: AgendaSectionEditorProps) {
  const familySelectOptions = [
    { value: "", label: "—" },
    ...familyOptions.map((f) => ({ value: f.familyId, label: f.label })),
  ];

  const updateAt = (index: number, patch: Partial<AgendaLineItem>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="space-y-4">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No rows yet — add one below.</li>
        ) : null}
        {items.map((item, index) => (
          <li key={item.id} className="space-y-2 rounded-md border border-dashed bg-muted/20 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1 space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateAt(index, { title: e.target.value })}
                  disabled={disabled}
                  placeholder="Short label"
                />
              </div>
              {showScheduledAt ? (
                <div className="w-40 space-y-1">
                  <Label className="text-xs">Scheduled (date)</Label>
                  <Input
                    type="date"
                    value={item.scheduledAt?.slice(0, 10) ?? ""}
                    onChange={(e) => updateAt(index, { scheduledAt: e.target.value || null })}
                    disabled={disabled}
                  />
                </div>
              ) : null}
              {showDueAt ? (
                <div className="w-36 space-y-1">
                  <Label className="text-xs">Due date</Label>
                  <Input
                    type="date"
                    value={item.dueAt?.slice(0, 10) ?? ""}
                    onChange={(e) => updateAt(index, { dueAt: e.target.value || null })}
                    disabled={disabled}
                  />
                </div>
              ) : null}
              {showFamily ? (
                <div className="min-w-[180px] flex-1 space-y-1">
                  <Label className="text-xs">Family</Label>
                  <Select
                    options={familySelectOptions}
                    value={item.familyId ?? ""}
                    onChange={(e) => updateAt(index, { familyId: e.target.value || null })}
                    disabled={disabled}
                  />
                </div>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-9 shrink-0 p-0 text-destructive"
                disabled={disabled}
                onClick={() => removeAt(index)}
                aria-label="Remove row"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={item.notes ?? ""}
                onChange={(e) => updateAt(index, { notes: e.target.value })}
                disabled={disabled}
                rows={2}
                placeholder="Optional details"
              />
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...items, { id: newId(), title: "" }])}
      >
        <Plus className="mr-1 size-4" />
        Add row
      </Button>
    </div>
  );
}
