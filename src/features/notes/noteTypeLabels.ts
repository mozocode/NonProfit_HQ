import type { NoteType, NoteVisibility } from "@/types/domain";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  update: "Update note",
  case: "Case note",
  assessment: "Assessment note",
  internal: "Internal note",
};

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  internal: "Staff only",
  shared: "Participant-safe (shared)",
};
