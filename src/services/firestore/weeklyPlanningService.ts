/**
 * Staff weekly agenda + weekly report CRUD, admin oversight.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import {
  agendaDocId,
  reportDocId,
  weekEndFromWeekStart,
  computeSubmissionDueAt,
  resolveWeeklyDisplayStatus,
  canEditWeeklySubmission,
} from "@/lib/weeklyPlanningUtils";
import type {
  AgendaLineItem,
  StaffReportItem,
  WeeklySubmissionStatus,
} from "@/types/domain";
import type {
  AdminWeekComparisonRow,
  AdminWeeklyAgendaRow,
  AdminWeeklyFilters,
  AdminWeeklyReportRow,
  StaffFamilyOption,
  WeeklyAgendaView,
  WeeklyReportView,
} from "@/types/weeklyPlanning";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function tsIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return "";
}

function newLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `li_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function migrateLegacyAgendaItems(
  items: Array<{ type?: string; title?: string; familyId?: string; dueAt?: string }> | undefined,
): {
  plannedMeetings: AgendaLineItem[];
  plannedFamilyFollowUps: AgendaLineItem[];
  plannedReferrals: AgendaLineItem[];
  plannedAdminTasks: AgendaLineItem[];
} {
  const plannedMeetings: AgendaLineItem[] = [];
  const plannedFamilyFollowUps: AgendaLineItem[] = [];
  const plannedReferrals: AgendaLineItem[] = [];
  const plannedAdminTasks: AgendaLineItem[] = [];
  if (!items?.length) {
    return { plannedMeetings, plannedFamilyFollowUps, plannedReferrals, plannedAdminTasks };
  }
  for (const it of items) {
    const title = it.title ?? "Item";
    const id = newLineId();
    const base: AgendaLineItem = {
      id,
      title,
      familyId: it.familyId ?? null,
      dueAt: it.dueAt ?? null,
    };
    const t = (it.type ?? "").toLowerCase();
    if (t.includes("meeting") || t.includes("call")) plannedMeetings.push(base);
    else if (t.includes("referral")) plannedReferrals.push(base);
    else if (t.includes("follow") || t.includes("family") || t.includes("visit")) plannedFamilyFollowUps.push(base);
    else plannedAdminTasks.push(base);
  }
  return { plannedMeetings, plannedFamilyFollowUps, plannedReferrals, plannedAdminTasks };
}

function parseAgendaData(
  d: Record<string, unknown>,
  id: string,
  organizationId: string,
  staffUid: string,
  weekStart: string,
): Omit<WeeklyAgendaView, "displayStatus" | "canEdit" | "storedStatus"> & {
  storedStatus: WeeklySubmissionStatus;
} {
  const weekEnd = (d.weekEnd as string) || weekEndFromWeekStart(weekStart);
  const legacyItems = d.items as
    | Array<{ type?: string; title?: string; familyId?: string; dueAt?: string }>
    | undefined;
  const migrated = migrateLegacyAgendaItems(legacyItems);
  const plannedMeetings = (d.plannedMeetings as AgendaLineItem[]) ?? migrated.plannedMeetings;
  const plannedFamilyFollowUps =
    (d.plannedFamilyFollowUps as AgendaLineItem[]) ?? migrated.plannedFamilyFollowUps;
  const plannedReferrals = (d.plannedReferrals as AgendaLineItem[]) ?? migrated.plannedReferrals;
  const plannedAdminTasks = (d.plannedAdminTasks as AgendaLineItem[]) ?? migrated.plannedAdminTasks;

  const submissionDueAt =
    (d.submissionDueAt as string) || computeSubmissionDueAt(weekEnd);
  const rawStatus = (d.status as WeeklySubmissionStatus) || "draft";

  return {
    agendaId: id,
    organizationId,
    staffUid,
    weekStart,
    weekEnd,
    plannedMeetings,
    plannedFamilyFollowUps,
    plannedReferrals,
    plannedAdminTasks,
    notes: (d.notes as string) ?? "",
    storedStatus: rawStatus,
    submittedAt: d.submittedAt ? tsIso(d.submittedAt) : null,
    reviewedAt: d.reviewedAt ? tsIso(d.reviewedAt) : null,
    reviewedByUid: (d.reviewedByUid as string) ?? null,
    submissionDueAt,
    createdAt: tsIso(d.createdAt),
    updatedAt: tsIso(d.updatedAt),
  };
}

async function syncOverdueOnDoc(
  ref: ReturnType<typeof doc>,
  stored: WeeklySubmissionStatus,
  submissionDueAt: string,
): Promise<WeeklySubmissionStatus> {
  if (stored === "submitted" || stored === "reviewed" || stored === "overdue") return stored;
  const now = new Date().toISOString();
  if (stored === "draft" && submissionDueAt && now > submissionDueAt) {
    await updateDoc(ref, { status: "overdue", updatedAt: serverTimestamp() });
    return "overdue";
  }
  return stored;
}

export async function fetchStaffFamilyOptions(organizationId: string, staffUid: string): Promise<StaffFamilyOption[]> {
  const db = guardDb();
  const assignSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.staffAssignments),
      where("organizationId", "==", organizationId),
      where("staffUid", "==", staffUid),
    ),
  );
  const familyIds = [
    ...new Set(
      assignSnap.docs.map((s) => s.data().familyId as string | null).filter((x): x is string => Boolean(x)),
    ),
  ];
  const out: StaffFamilyOption[] = [];
  for (const fid of familyIds) {
    const famSnap = await getDoc(doc(db, COLLECTIONS.families, fid));
    if (!famSnap.exists()) continue;
    const p = famSnap.data().primaryContact as { firstName?: string; lastName?: string } | undefined;
    const name = p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "";
    out.push({ familyId: fid, label: name || fid });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

export async function fetchWeeklyAgendaView(
  organizationId: string,
  staffUid: string,
  weekStart: string,
): Promise<WeeklyAgendaView> {
  const db = guardDb();
  const id = agendaDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyAgendas, id);
  const snap = await getDoc(ref);
  const weekEnd = weekEndFromWeekStart(weekStart);
  const submissionDueAt = computeSubmissionDueAt(weekEnd);

  if (!snap.exists()) {
    return {
      agendaId: id,
      organizationId,
      staffUid,
      weekStart,
      weekEnd,
      plannedMeetings: [],
      plannedFamilyFollowUps: [],
      plannedReferrals: [],
      plannedAdminTasks: [],
      notes: "",
      storedStatus: "draft",
      displayStatus: "draft",
      submittedAt: null,
      reviewedAt: null,
      reviewedByUid: null,
      submissionDueAt,
      canEdit: true,
      createdAt: "",
      updatedAt: "",
    };
  }

  const data = snap.data();
  const parsed = parseAgendaData(data, id, organizationId, staffUid, weekStart);
  const synced = await syncOverdueOnDoc(ref, parsed.storedStatus, parsed.submissionDueAt);
  const storedStatus = synced;
  const displayStatus = resolveWeeklyDisplayStatus(storedStatus, parsed.submissionDueAt);
  const canEdit = canEditWeeklySubmission(storedStatus, parsed.submissionDueAt);

  return {
    ...parsed,
    storedStatus,
    displayStatus,
    canEdit,
  };
}

export type SaveWeeklyAgendaInput = {
  plannedMeetings: AgendaLineItem[];
  plannedFamilyFollowUps: AgendaLineItem[];
  plannedReferrals: AgendaLineItem[];
  plannedAdminTasks: AgendaLineItem[];
  notes: string;
};

export async function saveWeeklyAgendaDraft(
  organizationId: string,
  staffUid: string,
  weekStart: string,
  input: SaveWeeklyAgendaInput,
): Promise<void> {
  const db = guardDb();
  const id = agendaDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyAgendas, id);
  const existing = await getDoc(ref);
  const weekEnd = weekEndFromWeekStart(weekStart);
  const submissionDueAt = computeSubmissionDueAt(weekEnd);

  const view = await fetchWeeklyAgendaView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("This agenda can no longer be edited (submitted or past deadline).");

  const now = serverTimestamp();
  const payload: Record<string, unknown> = {
    organizationId,
    staffUid,
    agendaId: id,
    weekStart,
    weekEnd,
    plannedMeetings: input.plannedMeetings,
    plannedFamilyFollowUps: input.plannedFamilyFollowUps,
    plannedReferrals: input.plannedReferrals,
    plannedAdminTasks: input.plannedAdminTasks,
    notes: input.notes,
    submissionDueAt,
    updatedAt: now,
  };

  if (!existing.exists()) {
    payload.createdAt = now;
    payload.status = "draft";
    payload.submittedAt = null;
    payload.reviewedAt = null;
    payload.reviewedByUid = null;
    await setDoc(ref, payload);
  } else {
    const st = (existing.data().status as WeeklySubmissionStatus) ?? "draft";
    if (st === "submitted" || st === "reviewed") throw new Error("Cannot edit a submitted agenda.");
    payload.status = st === "overdue" ? "overdue" : "draft";
    payload.createdAt = existing.data().createdAt ?? now;
    if (existing.data().submittedAt != null) payload.submittedAt = existing.data().submittedAt;
    if (existing.data().reviewedAt != null) payload.reviewedAt = existing.data().reviewedAt;
    if (existing.data().reviewedByUid != null) payload.reviewedByUid = existing.data().reviewedByUid;
    await setDoc(ref, payload, { merge: true });
  }
}

export async function submitWeeklyAgenda(organizationId: string, staffUid: string, weekStart: string): Promise<void> {
  const db = guardDb();
  const id = agendaDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyAgendas, id);
  const view = await fetchWeeklyAgendaView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("Cannot submit: deadline passed or already submitted.");
  const now = new Date().toISOString();
  const snap = await getDoc(ref);
  const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      staffUid,
      agendaId: id,
      weekStart: view.weekStart,
      weekEnd: view.weekEnd,
      plannedMeetings: view.plannedMeetings,
      plannedFamilyFollowUps: view.plannedFamilyFollowUps,
      plannedReferrals: view.plannedReferrals,
      plannedAdminTasks: view.plannedAdminTasks,
      notes: view.notes,
      submissionDueAt: view.submissionDueAt,
      status: "submitted",
      submittedAt: now,
      createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function toReportItem(d: Record<string, unknown>, itemId: string, organizationId: string, reportId: string): StaffReportItem {
  const activityDescription =
    (d.activityDescription as string) ?? (d.description as string) ?? "";
  const hoursSpent =
    typeof d.hoursSpent === "number"
      ? d.hoursSpent
      : ((Number(d.durationMinutes) || 0) / 60);
  return {
    organizationId,
    reportId,
    itemId,
    activityDescription,
    familyId: (d.familyId as string) ?? null,
    location: (d.location as string) ?? null,
    category: (d.category as string) ?? "other",
    hoursSpent: Math.round(hoursSpent * 1000) / 1000,
    notes: (d.notes as string) ?? null,
    createdAt: tsIso(d.createdAt),
    updatedAt: tsIso(d.updatedAt),
  };
}

async function fetchReportItems(organizationId: string, reportId: string): Promise<StaffReportItem[]> {
  const db = guardDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.staffReportItems),
      where("organizationId", "==", organizationId),
      where("reportId", "==", reportId),
    ),
  );
  return snap.docs.map((s) => toReportItem(s.data(), s.id, organizationId, reportId));
}

function sumHours(items: StaffReportItem[]): number {
  const t = items.reduce((s, i) => s + (Number(i.hoursSpent) || 0), 0);
  return Math.round(t * 1000) / 1000;
}

export async function fetchWeeklyReportView(
  organizationId: string,
  staffUid: string,
  weekStart: string,
): Promise<WeeklyReportView> {
  const db = guardDb();
  const id = reportDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyReports, id);
  const snap = await getDoc(ref);
  const weekEnd = weekEndFromWeekStart(weekStart);
  const submissionDueAtDefault = computeSubmissionDueAt(weekEnd);

  if (!snap.exists()) {
    return {
      reportId: id,
      organizationId,
      staffUid,
      weekStart,
      weekEnd,
      items: [],
      notes: null,
      storedStatus: "draft",
      displayStatus: "draft",
      submittedAt: null,
      reviewedAt: null,
      reviewedByUid: null,
      submissionDueAt: submissionDueAtDefault,
      canEdit: true,
      totalHours: 0,
      createdAt: "",
      updatedAt: "",
    };
  }

  const data = snap.data();
  const submissionDueAt = (data.submissionDueAt as string) || submissionDueAtDefault;
  let storedStatus = (data.status as WeeklySubmissionStatus) || "draft";
  storedStatus = await syncOverdueOnDoc(ref, storedStatus, submissionDueAt);

  const items = await fetchReportItems(organizationId, id);
  const displayStatus = resolveWeeklyDisplayStatus(storedStatus, submissionDueAt);
  const canEdit = canEditWeeklySubmission(storedStatus, submissionDueAt);
  const totalHours =
    data.totalHours != null && data.totalHours !== ""
      ? Number(data.totalHours)
      : sumHours(items);

  return {
    reportId: id,
    organizationId,
    staffUid,
    weekStart,
    weekEnd: (data.weekEnd as string) || weekEnd,
    items,
    notes: (data.notes as string) ?? null,
    storedStatus,
    displayStatus,
    submittedAt: data.submittedAt ? tsIso(data.submittedAt) : null,
    reviewedAt: data.reviewedAt ? tsIso(data.reviewedAt) : null,
    reviewedByUid: (data.reviewedByUid as string) ?? null,
    submissionDueAt,
    canEdit,
    totalHours,
    createdAt: tsIso(data.createdAt),
    updatedAt: tsIso(data.updatedAt),
  };
}

export type ReportItemInput = {
  itemId?: string;
  activityDescription: string;
  familyId: string | null;
  location: string | null;
  category: string;
  hoursSpent: number;
  notes: string | null;
};

export async function saveWeeklyReportDraft(
  organizationId: string,
  staffUid: string,
  weekStart: string,
  notes: string | null,
): Promise<void> {
  const db = guardDb();
  const id = reportDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyReports, id);
  const weekEnd = weekEndFromWeekStart(weekStart);
  const submissionDueAt = computeSubmissionDueAt(weekEnd);
  const view = await fetchWeeklyReportView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("This report can no longer be edited.");

  const items = await fetchReportItems(organizationId, id);
  const totalHours = sumHours(items);
  const now = serverTimestamp();
  const existing = await getDoc(ref);

  const payload: Record<string, unknown> = {
    organizationId,
    staffUid,
    reportId: id,
    weekStart,
    weekEnd,
    notes: notes ?? "",
    totalHours,
    submissionDueAt,
    updatedAt: now,
  };

  if (!existing.exists()) {
    payload.createdAt = now;
    payload.status = "draft";
    payload.submittedAt = null;
    payload.reviewedAt = null;
    payload.reviewedByUid = null;
    await setDoc(ref, payload);
  } else {
    const st = (existing.data().status as WeeklySubmissionStatus) ?? "draft";
    if (st === "submitted" || st === "reviewed") throw new Error("Cannot edit a submitted report.");
    payload.status = st === "overdue" ? "overdue" : "draft";
    payload.createdAt = existing.data().createdAt ?? now;
    await setDoc(ref, payload, { merge: true });
  }
}

export async function upsertReportItem(
  organizationId: string,
  staffUid: string,
  weekStart: string,
  input: ReportItemInput,
): Promise<string> {
  const db = guardDb();
  const reportId = reportDocId(organizationId, staffUid, weekStart);
  const reportRef = doc(db, COLLECTIONS.staffWeeklyReports, reportId);
  const view = await fetchWeeklyReportView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("This report is locked.");

  const weekEnd = weekEndFromWeekStart(weekStart);
  const submissionDueAt = computeSubmissionDueAt(weekEnd);
  const reportSnap = await getDoc(reportRef);
  if (!reportSnap.exists()) {
    await setDoc(reportRef, {
      organizationId,
      staffUid,
      reportId,
      weekStart,
      weekEnd,
      notes: view.notes ?? "",
      status: "draft",
      submittedAt: null,
      reviewedAt: null,
      reviewedByUid: null,
      submissionDueAt,
      totalHours: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const itemId = input.itemId || doc(collection(db, COLLECTIONS.staffReportItems)).id;
  const itemRef = doc(db, COLLECTIONS.staffReportItems, itemId);
  const now = serverTimestamp();
  const existingItem = await getDoc(itemRef);
  await setDoc(itemRef, {
    organizationId,
    reportId,
    itemId,
    activityDescription: input.activityDescription,
    familyId: input.familyId,
    location: input.location,
    category: input.category,
    hoursSpent: input.hoursSpent,
    notes: input.notes,
    createdAt: existingItem.exists() ? existingItem.data().createdAt ?? now : now,
    updatedAt: now,
  });

  const items = await fetchReportItems(organizationId, reportId);
  const totalHours = sumHours(items);
  await updateDoc(reportRef, {
    totalHours,
    updatedAt: now,
  });

  return itemId;
}

export async function deleteReportItem(
  organizationId: string,
  staffUid: string,
  weekStart: string,
  itemId: string,
): Promise<void> {
  const db = guardDb();
  const reportId = reportDocId(organizationId, staffUid, weekStart);
  const view = await fetchWeeklyReportView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("This report is locked.");

  await deleteDoc(doc(db, COLLECTIONS.staffReportItems, itemId));
  const items = await fetchReportItems(organizationId, reportId);
  const totalHours = sumHours(items);
  await updateDoc(doc(db, COLLECTIONS.staffWeeklyReports, reportId), {
    totalHours,
    updatedAt: serverTimestamp(),
  });
}

export async function submitWeeklyReport(organizationId: string, staffUid: string, weekStart: string): Promise<void> {
  const db = guardDb();
  const id = reportDocId(organizationId, staffUid, weekStart);
  const ref = doc(db, COLLECTIONS.staffWeeklyReports, id);
  const view = await fetchWeeklyReportView(organizationId, staffUid, weekStart);
  if (!view.canEdit) throw new Error("Cannot submit: deadline passed or already submitted.");
  const items = await fetchReportItems(organizationId, id);
  const totalHours = sumHours(items);
  const now = new Date().toISOString();
  const snap = await getDoc(ref);
  const createdAt = snap.exists() ? snap.data().createdAt : serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      staffUid,
      reportId: id,
      weekStart: view.weekStart,
      weekEnd: view.weekEnd,
      notes: view.notes ?? "",
      totalHours,
      submissionDueAt: view.submissionDueAt,
      status: "submitted",
      submittedAt: now,
      createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function adminMarkAgendaReviewed(
  organizationId: string,
  agendaId: string,
  adminUid: string,
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffWeeklyAgendas, agendaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Agenda not found");
  if ((snap.data().organizationId as string) !== organizationId) throw new Error("Wrong organization");
  const now = new Date().toISOString();
  await updateDoc(ref, {
    status: "reviewed",
    reviewedAt: now,
    reviewedByUid: adminUid,
    updatedAt: serverTimestamp(),
  });
}

export async function adminMarkReportReviewed(
  organizationId: string,
  reportId: string,
  adminUid: string,
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.staffWeeklyReports, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Report not found");
  if ((snap.data().organizationId as string) !== organizationId) throw new Error("Wrong organization");
  const now = new Date().toISOString();
  await updateDoc(ref, {
    status: "reviewed",
    reviewedAt: now,
    reviewedByUid: adminUid,
    updatedAt: serverTimestamp(),
  });
}

async function profileLabel(db: ReturnType<typeof guardDb>, uid: string): Promise<string> {
  const p = await getDoc(doc(db, COLLECTIONS.profiles, uid));
  if (!p.exists()) return uid;
  return (p.data().displayName as string) || (p.data().email as string) || uid;
}

export async function adminListWeeklyReports(
  organizationId: string,
  filters: AdminWeeklyFilters,
): Promise<AdminWeeklyReportRow[]> {
  const db = guardDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.staffWeeklyReports), where("organizationId", "==", organizationId)),
  );
  const rows: AdminWeeklyReportRow[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const staffUid = data.staffUid as string;
    if (filters.staffUid && filters.staffUid !== staffUid) continue;
    const weekStart = data.weekStart as string;
    if (filters.weekStart && filters.weekStart !== weekStart) continue;
    const weekEnd = (data.weekEnd as string) || weekEndFromWeekStart(weekStart);
    const submissionDueAt = (data.submissionDueAt as string) || computeSubmissionDueAt(weekEnd);
    let stored = (data.status as WeeklySubmissionStatus) || "draft";
    stored = await syncOverdueOnDoc(docSnap.ref, stored, submissionDueAt);
    const displayStatus = resolveWeeklyDisplayStatus(stored, submissionDueAt);
    const reportId = docSnap.id;
    const items = await fetchReportItems(organizationId, reportId);
    rows.push({
      reportId,
      staffUid,
      staffLabel: await profileLabel(db, staffUid),
      weekStart,
      weekEnd,
      displayStatus,
      submittedAt: data.submittedAt ? tsIso(data.submittedAt) : null,
      totalHours: data.totalHours != null ? Number(data.totalHours) : null,
      itemCount: items.length,
    });
  }
  rows.sort((a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : a.staffLabel.localeCompare(b.staffLabel)));
  return rows;
}

export async function adminListWeeklyAgendas(
  organizationId: string,
  filters: AdminWeeklyFilters,
): Promise<AdminWeeklyAgendaRow[]> {
  const db = guardDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.staffWeeklyAgendas), where("organizationId", "==", organizationId)),
  );
  const rows: AdminWeeklyAgendaRow[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const staffUid = data.staffUid as string;
    if (filters.staffUid && filters.staffUid !== staffUid) continue;
    const weekStart = data.weekStart as string;
    if (filters.weekStart && filters.weekStart !== weekStart) continue;
    const weekEnd = (data.weekEnd as string) || weekEndFromWeekStart(weekStart);
    const submissionDueAt = (data.submissionDueAt as string) || computeSubmissionDueAt(weekEnd);
    let stored = (data.status as WeeklySubmissionStatus) || "draft";
    stored = await syncOverdueOnDoc(docSnap.ref, stored, submissionDueAt);
    const displayStatus = resolveWeeklyDisplayStatus(stored, submissionDueAt);
    const parsed = parseAgendaData(data, docSnap.id, organizationId, staffUid, weekStart);
    const plannedTotal =
      parsed.plannedMeetings.length +
      parsed.plannedFamilyFollowUps.length +
      parsed.plannedReferrals.length +
      parsed.plannedAdminTasks.length;
    rows.push({
      agendaId: docSnap.id,
      staffUid,
      staffLabel: await profileLabel(db, staffUid),
      weekStart,
      weekEnd,
      displayStatus,
      submittedAt: parsed.submittedAt,
      plannedTotal,
    });
  }
  rows.sort((a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : a.staffLabel.localeCompare(b.staffLabel)));
  return rows;
}

export async function adminBuildComparisonGrid(
  organizationId: string,
  weekStart: string,
  staffUidFilter: string | null,
): Promise<AdminWeekComparisonRow[]> {
  const db = guardDb();
  const { staff: staffOptions } = await fetchSegmentFilterOptions(organizationId);
  /** When filtering to one uid, include that uid even if missing from segment (deep links / oversight). */
  const staffList = staffUidFilter
    ? [staffUidFilter]
    : staffOptions.map((s) => s.id);

  const rows: AdminWeekComparisonRow[] = [];
  for (const uid of staffList) {
    const [agenda, report] = await Promise.all([
      fetchWeeklyAgendaView(organizationId, uid, weekStart),
      fetchWeeklyReportView(organizationId, uid, weekStart),
    ]);
    const hasAgendaDoc = Boolean(agenda.updatedAt);
    const hasReportDoc = Boolean(report.updatedAt);
    const missingSubmission =
      report.displayStatus !== "submitted" && report.displayStatus !== "reviewed";
    rows.push({
      staffUid: uid,
      staffLabel: await profileLabel(db, uid),
      weekStart,
      weekEnd: agenda.weekEnd,
      agenda: hasAgendaDoc ? agenda : null,
      report: hasReportDoc ? report : null,
      missingSubmission,
    });
  }
  rows.sort((a, b) => a.staffLabel.localeCompare(b.staffLabel));
  return rows;
}
