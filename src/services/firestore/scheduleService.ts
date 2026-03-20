/**
 * Staff schedule entries: CRUD, range queries, resolved labels for UI.
 * Architecture: `syncSource` / `externalCalendarEventId` reserved for future calendar sync.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import { combineLocalDateAndTime, localDayBounds, toYmd } from "@/lib/scheduleDateUtils";
import type { StaffScheduleEntry } from "@/types/domain";
import type { CreateScheduleEntryInput, ScheduleEntryView, UpdateScheduleEntryInput } from "@/types/schedule";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function tsIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return "";
}

function docToEntry(id: string, data: Record<string, unknown>): StaffScheduleEntry {
  const startAt = tsIso(data.startAt);
  const date = (data.date as string) || startAt.slice(0, 10) || toYmd(new Date());
  return {
    organizationId: data.organizationId as string,
    staffUid: data.staffUid as string,
    entryId: id,
    date,
    startAt,
    endAt: tsIso(data.endAt),
    type: (data.type as StaffScheduleEntry["type"]) ?? "work",
    title: (data.title as string) ?? null,
    location: (data.location as string) ?? null,
    familyId: (data.familyId as string) ?? null,
    caseId: (data.caseId as string) ?? null,
    linkedStaffUid: (data.linkedStaffUid as string) ?? null,
    notes: (data.notes as string) ?? null,
    syncSource: (data.syncSource as StaffScheduleEntry["syncSource"]) ?? "local",
    externalCalendarEventId: (data.externalCalendarEventId as string) ?? null,
    createdAt: tsIso(data.createdAt),
    updatedAt: tsIso(data.updatedAt),
  };
}

async function familyLabel(db: ReturnType<typeof guardDb>, familyId: string | null): Promise<string | null> {
  if (!familyId) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.families, familyId));
  if (!snap.exists()) return familyId;
  const p = snap.data().primaryContact as { firstName?: string; lastName?: string } | undefined;
  const n = p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "";
  return n || familyId;
}

async function staffLabel(db: ReturnType<typeof guardDb>, uid: string | null): Promise<string | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.profiles, uid));
  if (!snap.exists()) return uid;
  return (snap.data().displayName as string) || (snap.data().email as string) || uid;
}

async function toView(db: ReturnType<typeof guardDb>, e: StaffScheduleEntry): Promise<ScheduleEntryView> {
  const [fam, linked, primary] = await Promise.all([
    familyLabel(db, e.familyId),
    staffLabel(db, e.linkedStaffUid),
    staffLabel(db, e.staffUid),
  ]);
  return { ...e, familyLabel: fam, linkedStaffLabel: linked, primaryStaffLabel: primary };
}

export async function listScheduleEntriesForOrg(
  organizationId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  options?: { staffUid?: string | null },
): Promise<StaffScheduleEntry[]> {
  const db = guardDb();
  let q = query(
    collection(db, COLLECTIONS.staffScheduleEntries),
    where("organizationId", "==", organizationId),
    where("startAt", ">=", rangeStartIso),
    where("startAt", "<=", rangeEndIso),
    orderBy("startAt", "asc"),
  );
  if (options?.staffUid) {
    q = query(
      collection(db, COLLECTIONS.staffScheduleEntries),
      where("organizationId", "==", organizationId),
      where("staffUid", "==", options.staffUid),
      where("startAt", ">=", rangeStartIso),
      where("startAt", "<=", rangeEndIso),
      orderBy("startAt", "asc"),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToEntry(d.id, d.data()));
}

/** Fallback when composite index missing: fetch by org and filter in memory (avoid for large orgs). */
export async function listScheduleEntriesForOrgLoose(
  organizationId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  options?: { staffUid?: string | null },
): Promise<StaffScheduleEntry[]> {
  const db = guardDb();
  try {
    return await listScheduleEntriesForOrg(organizationId, rangeStartIso, rangeEndIso, options);
  } catch {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.staffScheduleEntries), where("organizationId", "==", organizationId)),
    );
    let rows = snap.docs.map((d) => docToEntry(d.id, d.data()));
    rows = rows.filter((e) => e.startAt >= rangeStartIso && e.startAt <= rangeEndIso);
    if (options?.staffUid) rows = rows.filter((e) => e.staffUid === options.staffUid);
    rows.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return rows;
  }
}

export async function listScheduleEntryViewsForOrg(
  organizationId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  options?: { staffUid?: string | null },
): Promise<ScheduleEntryView[]> {
  const db = guardDb();
  const entries = await listScheduleEntriesForOrgLoose(organizationId, rangeStartIso, rangeEndIso, options);
  return Promise.all(entries.map((e) => toView(db, e)));
}

export async function getScheduleEntry(organizationId: string, entryId: string): Promise<StaffScheduleEntry | null> {
  const db = guardDb();
  const snap = await getDoc(doc(db, COLLECTIONS.staffScheduleEntries, entryId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) return null;
  return docToEntry(snap.id, data);
}

function buildScheduleFields(input: CreateScheduleEntryInput): Record<string, unknown> {
  const startAt = combineLocalDateAndTime(input.date, input.startTime);
  const endAt = combineLocalDateAndTime(input.date, input.endTime);
  if (new Date(endAt) <= new Date(startAt)) {
    throw new Error("End time must be after start time.");
  }
  return {
    date: input.date,
    startAt,
    endAt,
    type: input.type,
    title: input.title.trim() || null,
    location: input.location?.trim() || null,
    familyId: input.familyId,
    caseId: input.caseId?.trim() || null,
    linkedStaffUid: input.linkedStaffUid,
    notes: input.notes?.trim() || null,
    syncSource: "local",
    externalCalendarEventId: null,
  };
}

export async function createScheduleEntry(
  organizationId: string,
  staffUid: string,
  input: CreateScheduleEntryInput,
): Promise<string> {
  const db = guardDb();
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTIONS.staffScheduleEntries), {
    organizationId,
    staffUid,
    ...buildScheduleFields(input),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateScheduleEntry(
  organizationId: string,
  actorUid: string,
  input: UpdateScheduleEntryInput,
  options?: { asAdmin?: boolean },
): Promise<void> {
  const db = guardDb();
  const existing = await getScheduleEntry(organizationId, input.entryId);
  if (!existing) throw new Error("Entry not found");
  if (!options?.asAdmin && existing.staffUid !== actorUid) throw new Error("Not allowed to edit this entry");
  const now = serverTimestamp();
  await updateDoc(doc(db, COLLECTIONS.staffScheduleEntries, input.entryId), {
    ...buildScheduleFields(input),
    updatedAt: now,
  });
}

export async function deleteScheduleEntry(
  organizationId: string,
  actorUid: string,
  entryId: string,
  options?: { asAdmin?: boolean },
): Promise<void> {
  const db = guardDb();
  const existing = await getScheduleEntry(organizationId, entryId);
  if (!existing) throw new Error("Entry not found");
  if (!options?.asAdmin && existing.staffUid !== actorUid) throw new Error("Not allowed to delete this entry");
  await deleteDoc(doc(db, COLLECTIONS.staffScheduleEntries, entryId));
}

/** Per-staff rows for a single local day — "where" and "what" for admin dashboards. */
export async function adminStaffDaySummary(
  organizationId: string,
  dayYmd: string,
): Promise<
  {
    staffUid: string;
    staffLabel: string;
    location: string | null;
    summary: string;
    blocks: ScheduleEntryView[];
  }[]
> {
  const { startIso, endIso } = localDayBounds(dayYmd);
  const views = await listScheduleEntryViewsForOrg(organizationId, startIso, endIso);
  const byStaff = new Map<string, ScheduleEntryView[]>();
  views.forEach((v) => {
    if (!byStaff.has(v.staffUid)) byStaff.set(v.staffUid, []);
    byStaff.get(v.staffUid)!.push(v);
  });
  const db = guardDb();
  const out: {
    staffUid: string;
    staffLabel: string;
    location: string | null;
    summary: string;
    blocks: ScheduleEntryView[];
  }[] = [];
  for (const [uid, blocks] of byStaff) {
    blocks.sort((a, b) => a.startAt.localeCompare(b.startAt));
    const name = (await staffLabel(db, uid)) ?? uid;
    const primaryLoc = blocks.map((b) => b.location).find(Boolean) ?? null;
    const summary = blocks.map((b) => b.title || b.type).filter(Boolean).join(" · ") || "—";
    out.push({ staffUid: uid, staffLabel: name, location: primaryLoc, summary, blocks });
  }
  out.sort((a, b) => a.staffLabel.localeCompare(b.staffLabel));
  return out;
}
