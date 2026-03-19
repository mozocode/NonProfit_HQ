"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { getStandardStages, getStageLabel } from "@/lib/workflowUtils";

const STAGE_OPTIONS = getStandardStages().map((id) => ({
  value: id,
  label: getStageLabel(id),
}));

export interface ChangeStageSheetProps {
  currentStage: string;
  onStageChange: (stage: string, note?: string) => Promise<void>;
  isUpdating: boolean;
  trigger?: React.ReactNode;
}

export function ChangeStageSheet({
  currentStage,
  onStageChange,
  isUpdating,
  trigger,
}: ChangeStageSheetProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(currentStage);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === currentStage && !note.trim()) {
      setOpen(false);
      return;
    }
    setError(null);
    try {
      await onStageChange(stage, note.trim() || undefined);
      setStage(stage);
      setNote("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update stage");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Change stage
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Change workflow stage</SheetTitle>
          <SheetDescription>
            Move this family to a different stage. Optional note is stored in history.
          </SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select
              id="stage"
              options={STAGE_OPTIONS}
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Reason or context for the change"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating…" : "Update stage"}
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
