"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CreateInteractionInput } from "@/types/notesInteractions";
import type { InteractionType } from "@/types/domain";
import { INTERACTION_TYPE_LABELS } from "@/features/interactions/interactionTypeLabels";

const INTERACTION_TYPE_OPTIONS: { value: InteractionType; label: string }[] = [
  { value: "call", label: INTERACTION_TYPE_LABELS.call },
  { value: "meeting", label: INTERACTION_TYPE_LABELS.meeting },
  { value: "check_in", label: INTERACTION_TYPE_LABELS.check_in },
  { value: "referral_follow_up", label: INTERACTION_TYPE_LABELS.referral_follow_up },
  { value: "visit", label: INTERACTION_TYPE_LABELS.visit },
  { value: "email", label: INTERACTION_TYPE_LABELS.email },
  { value: "other", label: INTERACTION_TYPE_LABELS.other },
];

function toDateInputValue(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export interface LogInteractionSheetProps {
  familyId: string;
  onSubmit: (input: CreateInteractionInput) => Promise<void>;
  isSubmitting: boolean;
  trigger?: React.ReactNode;
}

export function LogInteractionSheet({
  familyId,
  onSubmit,
  isSubmitting,
  trigger,
}: LogInteractionSheetProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InteractionType>("call");
  const [occurredAt, setOccurredAt] = useState(() => toDateInputValue(new Date().toISOString()));
  const [summary, setSummary] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const at = occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString();
      await onSubmit({
        type,
        occurredAt: at,
        summary: summary.trim() || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) || null : null,
      });
      setSummary("");
      setDurationMinutes("");
      setOccurredAt(toDateInputValue(new Date().toISOString()));
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log interaction");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Log interaction
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Log interaction</SheetTitle>
          <SheetDescription>
            Record a call, meeting, check-in, referral follow-up, or other contact.
          </SheetDescription>
        </SheetHeader>
        <form className="mt-6 flex flex-1 flex-col gap-4 overflow-auto" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              options={INTERACTION_TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as InteractionType)}
            />
          </div>
          <div>
            <Label htmlFor="occurredAt">Date & time</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was discussed or accomplished…"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="durationMinutes">Duration (minutes, optional)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
