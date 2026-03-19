import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  type Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type {
  Reminder,
  StaffActionPrompt,
  ReminderType,
  StaffActionPromptType,
  PromptActionLogEntry,
} from "@/types/domain";
import type { ReminderView, StaffActionPromptView, LogActionInput } from "@/types/notifications";

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

function toReminderView(
  d: Record<string, unknown>,
  id: string,
  familyName: string | null
): ReminderView {
  return {
    reminderId: id,
    type: (d.type as ReminderType) ?? "task",
    targetId: (d.targetId as string) ?? "",
    familyId: (d.familyId as string) ?? null,
    familyName,
    title: (d.title as string) ?? "Reminder",
    dueAt: timestampToIso(d.dueAt) ?? (d.dueAt as string) ?? "",
    acknowledgedAt: timestampToIso(d.acknowledgedAt) ?? (d.acknowledgedAt as string) ?? null,
    assignedToUid: (d.assignedToUid as string) ?? null,
  };
}

function toPromptView(d: Record<string, unknown>, id: string): StaffActionPromptView {
  const actionLog = (d.actionLog as PromptActionLogEntry[] | undefined) ?? [];
  return {
    promptId: id,
    type: (d.type as StaffActionPromptType) ?? "overdue_follow_up",
    dueAt: timestampToIso(d.dueAt) ?? (d.dueAt as string) ?? "",
    title: (d.title as string) ?? "Action required",
    completedAt: timestampToIso(d.completedAt) ?? (d.completedAt as string) ?? null,
    familyId: (d.familyId as string) ?? null,
    targetId: (d.targetId as string) ?? null,
    actionLogCount: actionLog.length,
    createdByAdmin: (d.createdByUid as string) != null,
  };
}

/** Fetch reminders assigned to a staff member (optionally only unacknowledged). */
export async function getRemindersForStaff(
  organizationId: string,
  staffUid: string,
  options?: { acknowledgedOnly?: boolean; unacknowledgedOnly?: boolean }
): Promise<ReminderView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.reminders);
  let q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("assignedToUid", "==", staffUid),
    orderBy("dueAt", "asc")
  );
  const snap = await getDocs(q);
  const familyNames = new Map<string, string>();
  let list = snap.docs.map((s) => {
    const d = s.data();
    const familyId = (d.familyId as string) ?? null;
    return toReminderView(d, s.id, familyId ? familyNames.get(familyId) ?? null : null);
  });
  if (options?.unacknowledgedOnly) {
    list = list.filter((r) => !r.acknowledgedAt);
  } else if (options?.acknowledgedOnly) {
    list = list.filter((r) => !!r.acknowledgedAt);
  }
  return list;
}

/** Fetch all reminders for org (admin or for reminder center). */
export async function getRemindersForOrganization(
  organizationId: string,
  options?: { assignedToUid?: string | null; unacknowledgedOnly?: boolean }
): Promise<ReminderView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.reminders);
  let q = query(
    ref,
    where("organizationId", "==", organizationId),
    orderBy("dueAt", "asc")
  );
  if (options?.assignedToUid) {
    q = query(
      ref,
      where("organizationId", "==", organizationId),
      where("assignedToUid", "==", options.assignedToUid),
      orderBy("dueAt", "asc")
    );
  }
  const snap = await getDocs(q);
  let list = snap.docs.map((s) => {
    const d = s.data();
    return toReminderView(d, s.id, null);
  });
  if (options?.unacknowledgedOnly) {
    list = list.filter((r) => !r.acknowledgedAt);
  }
  return list;
}

/** Acknowledge a reminder. Preserves immutable fields for Firestore rules. */
export async function acknowledgeReminder(
  organizationId: string,
  reminderId: string,
  _acknowledgedByUid: string
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.reminders, reminderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Reminder not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Reminder not in organization");
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    acknowledgedAt: now,
    updatedAt: now,
    organizationId: data.organizationId,
    createdAt: data.createdAt,
  };
  if (data.createdBy !== undefined) payload.createdBy = data.createdBy;
  await updateDoc(ref, payload as Record<string, unknown>);
}

/** Fetch unresolved (incomplete) staff action prompts for a staff user. */
export async function getStaffPrompts(
  organizationId: string,
  staffUid: string,
  completedOnly = false
): Promise<StaffActionPromptView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.staffActionPrompts);
  let q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("staffUid", "==", staffUid),
    orderBy("dueAt", "asc")
  );
  const snap = await getDocs(q);
  let list = snap.docs.map((s) => toPromptView(s.data(), s.id));
  if (!completedOnly) {
    list = list.filter((p) => !p.completedAt);
  } else {
    list = list.filter((p) => !!p.completedAt);
  }
  return list;
}

/** Get a single prompt by id. */
export async function getStaffPrompt(
  organizationId: string,
  promptId: string
): Promise<StaffActionPromptView | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffActionPrompts, promptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) return null;
  return toPromptView(data, snap.id);
}

/** Get full prompt with action log entries for detail view. */
export async function getStaffPromptWithActionLog(
  organizationId: string,
  promptId: string
): Promise<(StaffActionPromptView & { actionLog: Array<{ date: string; method: string; outcome: string; loggedAt: string; loggedByUid: string }> }) | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffActionPrompts, promptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) return null;
  const view = toPromptView(data, snap.id);
  const actionLog = ((data.actionLog as PromptActionLogEntry[]) ?? []).map((e) => ({
    date: e.date,
    method: e.method,
    outcome: e.outcome,
    loggedAt: e.loggedAt,
    loggedByUid: e.loggedByUid,
  }));
  return { ...view, actionLog };
}

/** Mark a staff action prompt as completed. */
export async function completeStaffPrompt(
  organizationId: string,
  promptId: string,
  completedByUid: string
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffActionPrompts, promptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Prompt not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Prompt not in organization");
  const now = new Date().toISOString();
  await updateDoc(ref, {
    completedAt: now,
    updatedAt: now,
    organizationId: data.organizationId,
    createdByUid: data.createdByUid ?? null,
    createdAt: data.createdAt,
  });
}

/** Append an action log entry to a staff prompt. */
export async function logPromptAction(
  organizationId: string,
  promptId: string,
  loggedByUid: string,
  input: LogActionInput
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffActionPrompts, promptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Prompt not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Prompt not in organization");
  const actionLog: PromptActionLogEntry[] = (data.actionLog as PromptActionLogEntry[] | undefined) ?? [];
  const now = new Date().toISOString();
  const entry: PromptActionLogEntry = {
    date: input.date,
    method: input.method,
    outcome: input.outcome,
    loggedAt: now,
    loggedByUid,
  };
  await updateDoc(ref, {
    actionLog: [...actionLog, entry],
    updatedAt: now,
    organizationId: data.organizationId,
    createdByUid: data.createdByUid ?? null,
    createdAt: data.createdAt,
  });
}
