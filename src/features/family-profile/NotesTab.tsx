"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "@/components/ui/note-card";
import { Section } from "@/components/ui/section";
import { NoteComposer } from "@/features/notes/NoteComposer";
import { NOTE_TYPE_LABELS } from "@/features/notes/noteTypeLabels";
import type { FamilyProfileData } from "@/types/familyProfile";
import type { NoteView } from "@/types/notesInteractions";
import type { CreateNoteInput } from "@/types/notesInteractions";
import { FileText } from "lucide-react";

export interface NotesTabProps {
  data: FamilyProfileData;
  /** When provided, show these notes (reverse chronological) and the note composer. */
  notesFromHook?: NoteView[] | null;
  isLoadingNotes?: boolean;
  onAddNote?: (input: CreateNoteInput) => Promise<void>;
  isAddingNote?: boolean;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotesTab({
  data,
  notesFromHook,
  isLoadingNotes,
  onAddNote,
  isAddingNote,
}: NotesTabProps) {
  const useRealNotes = notesFromHook != null;
  const notes = useRealNotes ? notesFromHook : data.notes;
  const showComposer = useRealNotes && onAddNote != null && data.summary.familyId;

  if (isLoadingNotes) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading notes…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showComposer && (
        <Section
          title="Add note"
          description="Update, case, assessment, or internal notes. Choose staff-only or participant-safe visibility."
          action={
            <NoteComposer
              familyId={data.summary.familyId}
              onSubmit={onAddNote}
              isSubmitting={!!isAddingNote}
            />
          }
        />
      )}
      <Section title="Notes" description="Reverse chronological order.">
        {notes.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-10" />}
            title="No notes"
            description="Case notes will appear here."
          />
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.noteId}>
                <NoteCard
                  title={
                    "title" in note && (note as NoteView).title
                      ? (note as NoteView).title!
                      : "noteType" in note
                        ? NOTE_TYPE_LABELS[(note as NoteView).noteType as keyof typeof NOTE_TYPE_LABELS]
                        : undefined
                  }
                  content={note.content}
                  author={(note as { authorName?: string }).authorName ?? undefined}
                  timestamp={formatTimestamp(note.createdAt)}
                  visibility={note.visibility}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
