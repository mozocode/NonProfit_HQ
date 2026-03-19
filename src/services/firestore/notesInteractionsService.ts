import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { Interaction, Note } from "@/types/domain";
import type {
  InteractionView,
  NoteView,
  TimelineEntryView,
  CreateInteractionInput,
  CreateNoteInput,
} from "@/types/notesInteractions";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp)?.toDate === "function") return (value as Timestamp).toDate().toISOString();
  return null;
}

// ---- Interactions ----
function toInteraction(d: Record<string, unknown>, id: string): Interaction {
  return {
    organizationId: d.organizationId as string,
    familyId: d.familyId as string,
    interactionId: id,
    type: d.type as Interaction["type"],
    staffUid: d.staffUid as string,
    occurredAt: timestampToIso(d.occurredAt) ?? (d.occurredAt as string) ?? "",
    summary: (d.summary as string) ?? null,
    durationMinutes: (d.durationMinutes as number) ?? null,
    createdBy: d.createdBy as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
  };
}

export async function getInteractionsByFamily(
  organizationId: string,
  familyId: string,
  options?: { limitCount?: number },
): Promise<InteractionView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.interactions);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
    orderBy("occurredAt", "desc"),
    limit(options?.limitCount ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const i = toInteraction(s.data(), s.id);
    return {
      ...i,
      staffName: null,
    };
  });
}

export async function createInteraction(
  organizationId: string,
  familyId: string,
  createdBy: string,
  input: CreateInteractionInput,
): Promise<string> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.interactions);
  const now = serverTimestamp();
  const docRef = await addDoc(ref, {
    organizationId,
    familyId,
    type: input.type,
    staffUid: createdBy,
    occurredAt: input.occurredAt,
    summary: input.summary ?? null,
    durationMinutes: input.durationMinutes ?? null,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

// ---- Notes ----
function toNote(d: Record<string, unknown>, id: string): Note {
  return {
    organizationId: d.organizationId as string,
    familyId: (d.familyId as string) ?? null,
    caseId: (d.caseId as string) ?? null,
    assessmentId: (d.assessmentId as string) ?? null,
    noteId: id,
    authorUid: d.authorUid as string,
    noteType: (d.noteType as Note["noteType"]) ?? "case",
    visibility: d.visibility as Note["visibility"],
    title: (d.title as string) ?? null,
    content: d.content as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
  };
}

export async function getNotesByFamily(
  organizationId: string,
  familyId: string,
  options?: { limitCount?: number; visibilityFilter?: "all" | "internal" | "shared" },
): Promise<NoteView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.notes);
  let q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
    orderBy("createdAt", "desc"),
    limit(options?.limitCount ?? 200),
  );
  if (options?.visibilityFilter && options.visibilityFilter !== "all") {
    q = query(
      ref,
      where("organizationId", "==", organizationId),
      where("familyId", "==", familyId),
      where("visibility", "==", options.visibilityFilter),
      orderBy("createdAt", "desc"),
      limit(options?.limitCount ?? 200),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const n = toNote(s.data(), s.id);
    return { ...n, authorName: null };
  });
}

export async function createNote(
  organizationId: string,
  createdBy: string,
  input: CreateNoteInput,
): Promise<string> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.notes);
  const now = serverTimestamp();
  const docRef = await addDoc(ref, {
    organizationId,
    familyId: input.familyId,
    caseId: input.caseId ?? null,
    assessmentId: input.assessmentId ?? null,
    authorUid: createdBy,
    noteType: input.noteType ?? "case",
    visibility: input.visibility,
    title: input.title ?? null,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Merged timeline: notes + interactions for family, sorted by date descending (newest first). */
export async function getTimelineByFamily(
  organizationId: string,
  familyId: string,
  options?: { limitCount?: number; visibilityFilter?: "all" | "internal" | "shared" },
): Promise<TimelineEntryView[]> {
  const [notes, interactions] = await Promise.all([
    getNotesByFamily(organizationId, familyId, {
      limitCount: options?.limitCount ?? 100,
      visibilityFilter: options?.visibilityFilter,
    }),
    getInteractionsByFamily(organizationId, familyId, { limitCount: options?.limitCount ?? 100 }),
  ]);

  const entries: TimelineEntryView[] = [];

  notes.forEach((n) => {
    entries.push({
      id: `note-${n.noteId}`,
      type: "note",
      title: n.title ?? noteTypeToTitle(n.noteType),
      description: n.content.slice(0, 200) + (n.content.length > 200 ? "…" : ""),
      timestamp: n.createdAt,
      meta: { noteId: n.noteId, noteType: n.noteType },
    });
  });

  interactions.forEach((i) => {
    entries.push({
      id: `interaction-${i.interactionId}`,
      type: "interaction",
      title: interactionTypeToTitle(i.type),
      description: i.summary,
      timestamp: i.occurredAt,
      meta: { interactionId: i.interactionId, interactionType: i.type },
    });
  });

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return options?.limitCount ? entries.slice(0, options.limitCount) : entries;
}

function noteTypeToTitle(noteType: string): string {
  const t: Record<string, string> = {
    update: "Update note",
    case: "Case note",
    assessment: "Assessment note",
    internal: "Internal note",
  };
  return t[noteType] ?? "Note";
}

function interactionTypeToTitle(interactionType: string): string {
  const t: Record<string, string> = {
    call: "Phone call",
    meeting: "Meeting",
    check_in: "Check-in",
    referral_follow_up: "Referral follow-up",
    visit: "Visit",
    email: "Email",
    other: "Other",
  };
  return t[interactionType] ?? interactionType;
}
