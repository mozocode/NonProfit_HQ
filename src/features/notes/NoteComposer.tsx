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
import type { CreateNoteInput } from "@/types/notesInteractions";
import type { NoteType, NoteVisibility } from "@/types/domain";
import { NOTE_TYPE_LABELS, NOTE_VISIBILITY_LABELS } from "@/features/notes/noteTypeLabels";

const NOTE_TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "update", label: NOTE_TYPE_LABELS.update },
  { value: "case", label: NOTE_TYPE_LABELS.case },
  { value: "assessment", label: NOTE_TYPE_LABELS.assessment },
  { value: "internal", label: NOTE_TYPE_LABELS.internal },
];

const VISIBILITY_OPTIONS: { value: NoteVisibility; label: string }[] = [
  { value: "internal", label: NOTE_VISIBILITY_LABELS.internal },
  { value: "shared", label: NOTE_VISIBILITY_LABELS.shared },
];

export interface NoteComposerProps {
  familyId: string;
  onSubmit: (input: CreateNoteInput) => Promise<void>;
  isSubmitting: boolean;
  trigger?: React.ReactNode;
}

export function NoteComposer({ familyId, onSubmit, isSubmitting, trigger }: NoteComposerProps) {
  const [open, setOpen] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>("case");
  const [visibility, setVisibility] = useState<NoteVisibility>("internal");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    try {
      await onSubmit({
        noteType,
        visibility,
        title: title.trim() || null,
        content: content.trim(),
        familyId,
      });
      setTitle("");
      setContent("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">Add note</Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add note</SheetTitle>
          <SheetDescription>
            Update notes, case notes, assessment notes, or internal notes. Choose visibility (staff-only vs participant-safe).
          </SheetDescription>
        </SheetHeader>
        <form className="mt-6 flex flex-1 flex-col gap-4 overflow-auto" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="noteType">Note type</Label>
            <Select
              id="noteType"
              options={NOTE_TYPE_OPTIONS}
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              id="visibility"
              options={VISIBILITY_OPTIONS}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
            />
          </div>
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content…"
              rows={8}
              required
              className="min-h-[160px] resize-y"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "Saving…" : "Save note"}
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
