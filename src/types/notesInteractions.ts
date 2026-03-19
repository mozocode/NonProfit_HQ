/**
 * View and input types for notes and interactions (family profile, timeline).
 */

import type { InteractionType, NoteType, NoteVisibility } from "@/types/domain";

export interface InteractionView {
  interactionId: string;
  familyId: string;
  type: InteractionType;
  staffUid: string;
  staffName?: string | null;
  occurredAt: string;
  summary: string | null;
  durationMinutes: number | null;
  createdBy: string;
  createdAt: string;
}

export interface NoteView {
  noteId: string;
  familyId: string | null;
  noteType: NoteType;
  visibility: NoteVisibility;
  title: string | null;
  content: string;
  authorUid: string;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInteractionInput {
  type: InteractionType;
  occurredAt: string;
  summary?: string | null;
  durationMinutes?: number | null;
}

export interface CreateNoteInput {
  noteType: NoteType;
  visibility: NoteVisibility;
  title?: string | null;
  content: string;
  familyId: string | null;
  caseId?: string | null;
  assessmentId?: string | null;
}

export interface TimelineEntryView {
  id: string;
  type: "note" | "interaction";
  title: string;
  description: string | null;
  timestamp: string;
  meta?: { noteId?: string; interactionId?: string; noteType?: NoteType; interactionType?: InteractionType };
}
