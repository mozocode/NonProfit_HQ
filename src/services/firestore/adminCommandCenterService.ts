/**
 * Admin Command Center: aggregates for overview, activity feed, and staff oversight.
 */

import {
  collection,
  collectionGroup,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
} from "firebase/firestore";

import { ROUTES } from "@/constants";
import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import { resolveSegmentFamilyIds } from "@/services/firestore/adminReportingService";
import type { ReportingSegmentFilters } from "@/types/reporting";
import type {
  CommandCenterDashboard,
  CommandCenterDateRange,
  CommandCenterFilters,
  ActivityFeedItem,
  StaffOversightRow,
} from "@/types/commandCenter";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function toIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function dayStart(isoDate: string): string {
  return new Date(isoDate + "T00:00:00.000Z").toISOString();
}

function dayEnd(isoDate: string): string {
  return new Date(isoDate + "T23:59:59.999Z").toISOString();
}

function inRange(iso: string, start: string, end: string): boolean {
  if (!iso) return false;
  return iso >= start && iso <= end;
}

/** Week start (Sunday) as YYYY-MM-DD, local calendar — matches mock staff dashboard convention. */
export function getCurrentWeekStartDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function filtersToReportingSegments(f: CommandCenterFilters): ReportingSegmentFilters {
  return {
    schoolId: f.schoolId,
    partnerOrgId: f.partnerOrgId,
    programId: f.programId,
    staffUid: null,
  };
}

function familyLabel(primary: { firstName?: string; lastName?: string } | undefined): string {
  if (!primary) return "Family";
  const fn = primary.firstName ?? "";
  const ln = primary.lastName ?? "";
  const s = `${fn} ${ln}`.trim();
  return s || "Family";
}

export interface FetchCommandCenterParams {
  organizationId: string;
  range: CommandCenterDateRange;
  filters: CommandCenterFilters;
}

export async function fetchCommandCenterDashboard(params: FetchCommandCenterParams): Promise<CommandCenterDashboard> {
  const db = guardDb();
  const { organizationId, range, filters } = params;
  const rangeStart = dayStart(range.start);
  const rangeEnd = dayEnd(range.end);
  const segments = filtersToReportingSegments(filters);

  const segmentFamilyIds = await resolveSegmentFamilyIds(organizationId, segments, range);

  const familiesSnap = await getDocs(
    query(collection(db, COLLECTIONS.families), where("organizationId", "==", organizationId)),
  );

  let familyRows = familiesSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      status: data.status as string,
      primaryContact: data.primaryContact as { firstName?: string; lastName?: string } | undefined,
    };
  });

  if (segmentFamilyIds) {
    familyRows = familyRows.filter((f) => segmentFamilyIds.has(f.id));
  }

  const familyIdSet = new Set(familyRows.map((f) => f.id));
  const familyNameById = new Map(familyRows.map((f) => [f.id, familyLabel(f.primaryContact)]));

  const totalFamilies = familyRows.length;
  const activeCases = familyRows.filter((f) => f.status === "active").length;

  const membersSnap = await getDocs(
    query(collectionGroup(db, COLLECTIONS.familyMembers), where("organizationId", "==", organizationId)),
  );
  let totalParticipants = 0;
  membersSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    if (data.isParticipant === true) totalParticipants++;
  });

  const membershipsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.organizationMemberships),
      where("organizationId", "==", organizationId),
      where("active", "==", true),
    ),
  );
  const staffUids: string[] = [];
  membershipsSnap.docs.forEach((d) => {
    const role = d.data().role as string;
    if (role === "staff" || role === "admin") staffUids.push(d.data().uid as string);
  });
  const uniqueStaffUids = [...new Set(staffUids)];
  const activeStaff = uniqueStaffUids.length;

  const tasksSnap = await getDocs(
    query(collectionGroup(db, COLLECTIONS.goalTasks), where("organizationId", "==", organizationId)),
  );
  const today = new Date().toISOString().slice(0, 10);
  let overdueFollowUps = 0;
  tasksSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    const st = data.status as string;
    if (st !== "todo" && st !== "in_progress") return;
    const due = (data.dueDate as string) ?? "";
    if (due && due < today) overdueFollowUps++;
  });

  const reqSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.familyDocumentRequirements),
      where("organizationId", "==", organizationId),
      where("status", "==", "missing"),
    ),
  );
  let missingDocuments = 0;
  reqSnap.docs.forEach((d) => {
    if (familyIdSet.has(d.data().familyId as string)) missingDocuments++;
  });

  const referralsSnap = await getDocs(
    query(collection(db, COLLECTIONS.referrals), where("organizationId", "==", organizationId)),
  );
  let referralsInProgress = 0;
  let completedReferralsInRange = 0;
  referralsSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    const status = data.status as string;
    if (status === "pending") referralsInProgress++;
    if (status === "completed") {
      const completedAt = toIso(data.completedAt);
      const referredAt = toIso(data.referredAt);
      const endMark = completedAt || referredAt;
      if (inRange(endMark, rangeStart, rangeEnd)) completedReferralsInRange++;
    }
  });

  const overview = {
    totalFamilies,
    totalParticipants,
    activeStaff,
    activeCases,
    overdueFollowUps,
    missingDocuments,
    referralsInProgress,
    completedReferralsInRange,
  };

  // ---- Activity feed (fetch recent, then filter by segment + range in memory) ----
  const activityItems: ActivityFeedItem[] = [];

  const interactionsQ = query(
    collection(db, COLLECTIONS.interactions),
    where("organizationId", "==", organizationId),
    orderBy("occurredAt", "desc"),
    limit(120),
  );
  const interactionsSnap = await getDocs(interactionsQ);
  interactionsSnap.docs.forEach((d) => {
    const data = d.data();
    const fid = data.familyId as string;
    if (!familyIdSet.has(fid)) return;
    const at = toIso(data.occurredAt);
    if (!inRange(at, rangeStart, rangeEnd)) return;
    const type = (data.type as string) ?? "interaction";
    activityItems.push({
      id: `int-${d.id}`,
      kind: "interaction",
      at,
      title: `Staff interaction (${type})`,
      subtitle: familyNameById.get(fid) ?? null,
      actorUid: (data.staffUid as string) ?? null,
      familyId: fid,
      href: ROUTES.STAFF_FAMILY(fid),
    });
  });

  const docsQ = query(
    collection(db, COLLECTIONS.familyDocuments),
    where("organizationId", "==", organizationId),
    orderBy("uploadedAt", "desc"),
    limit(120),
  );
  const documentsSnap = await getDocs(docsQ);
  documentsSnap.docs.forEach((d) => {
    const data = d.data();
    const fid = data.familyId as string;
    if (!familyIdSet.has(fid)) return;
    const at = toIso(data.uploadedAt);
    if (!inRange(at, rangeStart, rangeEnd)) return;
    const fileName = (data.fileName as string) ?? "Document";
    activityItems.push({
      id: `doc-${d.id}`,
      kind: "document",
      at,
      title: `Document uploaded: ${fileName}`,
      subtitle: familyNameById.get(fid) ?? null,
      actorUid: (data.uploadedBy as string) ?? null,
      familyId: fid,
      href: ROUTES.STAFF_FAMILY(fid),
    });
  });

  const referralsFeedQ = query(
    collection(db, COLLECTIONS.referrals),
    where("organizationId", "==", organizationId),
    orderBy("referredAt", "desc"),
    limit(120),
  );
  let referralsFeedSnap;
  try {
    referralsFeedSnap = await getDocs(referralsFeedQ);
  } catch {
    const loose = await getDocs(
      query(collection(db, COLLECTIONS.referrals), where("organizationId", "==", organizationId), limit(300)),
    );
    referralsFeedSnap = {
      docs: [...loose.docs].sort((a, b) => {
        const ta = toIso(a.data().referredAt);
        const tb = toIso(b.data().referredAt);
        return tb.localeCompare(ta);
      }),
    } as typeof loose;
  }
  referralsFeedSnap.docs.forEach((d) => {
    const data = d.data();
    const fid = data.familyId as string;
    if (!familyIdSet.has(fid)) return;
    const at = toIso(data.referredAt);
    if (!inRange(at, rangeStart, rangeEnd)) return;
    const status = data.status as string;
    activityItems.push({
      id: `ref-${d.id}`,
      kind: "referral",
      at,
      title: `Referral ${status}`,
      subtitle: familyNameById.get(fid) ?? null,
      actorUid: (data.referredBy as string) ?? null,
      familyId: fid,
      href: ROUTES.STAFF_FAMILY(fid),
    });
  });

  const auditQ = query(
    collection(db, COLLECTIONS.auditLogs),
    where("organizationId", "==", organizationId),
    orderBy("createdAt", "desc"),
    limit(120),
  );
  const auditSnap = await getDocs(auditQ);
  auditSnap.docs.forEach((d) => {
    const data = d.data();
    const at = toIso(data.createdAt);
    if (!inRange(at, rangeStart, rangeEnd)) return;
    const action = (data.action as string) ?? "update";
    const resourceType = (data.resourceType as string) ?? "";
    const meta = (data.metadata as Record<string, unknown> | undefined) ?? {};
    const metaFamily = meta.familyId as string | undefined;
    const resourceId = data.resourceId as string | undefined;
    let fid: string | null = metaFamily ?? null;
    if (!fid && resourceType === "enrollment" && resourceId) fid = resourceId;
    if (fid && !familyIdSet.has(fid)) return;
    if (!fid && segmentFamilyIds) return;
    activityItems.push({
      id: `wf-${d.id}`,
      kind: "workflow",
      at,
      title: `Workflow: ${action.replace(/_/g, " ")}`,
      subtitle: fid ? (familyNameById.get(fid) ?? null) : "Organization",
      actorUid: (data.actorUid as string) ?? null,
      familyId: fid,
      href: fid ? ROUTES.STAFF_FAMILY(fid) : null,
    });
  });

  activityItems.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const activityFeed = activityItems.slice(0, 40);

  // ---- Staff oversight ----
  const profileByUid = new Map<string, { displayName: string | null; email: string | null; lastActiveAt: string | null }>();
  await Promise.all(
    uniqueStaffUids.map(async (uid) => {
      const pSnap = await getDoc(doc(db, COLLECTIONS.profiles, uid));
      if (!pSnap.exists()) {
        profileByUid.set(uid, { displayName: null, email: null, lastActiveAt: null });
        return;
      }
      const p = pSnap.data();
      profileByUid.set(uid, {
        displayName: (p.displayName as string) ?? null,
        email: (p.email as string) ?? null,
        lastActiveAt: toIso(p.lastActiveAt) || null,
      });
    }),
  );

  const tasksByStaff = new Map<string, number>();
  tasksSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    const uid = data.assignedToUid as string | null;
    if (!uid) return;
    const st = data.status as string;
    if (st !== "todo" && st !== "in_progress") return;
    tasksByStaff.set(uid, (tasksByStaff.get(uid) ?? 0) + 1);
  });

  const promptsSnap = await getDocs(
    query(collection(db, COLLECTIONS.staffActionPrompts), where("organizationId", "==", organizationId)),
  );
  const overduePromptsByStaff = new Map<string, number>();
  promptsSnap.docs.forEach((d) => {
    const data = d.data();
    const uid = data.staffUid as string;
    if (!uniqueStaffUids.includes(uid)) return;
    if (toIso(data.completedAt)) return;
    const due = toIso(data.dueAt) || (data.dueAt as string) || "";
    if (due && due.slice(0, 10) < today) {
      overduePromptsByStaff.set(uid, (overduePromptsByStaff.get(uid) ?? 0) + 1);
    }
  });

  const weekStart = getCurrentWeekStartDateString();

  const staffOversight: StaffOversightRow[] = await Promise.all(
    uniqueStaffUids.map(async (uid) => {
      const prof = profileByUid.get(uid);
      const displayName = prof?.displayName || uid;
      const email = prof?.email ?? null;
      const lastActiveAt = prof?.lastActiveAt ?? null;

      const reportQ = query(
        collection(db, COLLECTIONS.staffWeeklyReports),
        where("organizationId", "==", organizationId),
        where("staffUid", "==", uid),
        where("weekStart", "==", weekStart),
        limit(1),
      );
      const reportSnap = await getDocs(reportQ);
      let weeklyReportStatus: StaffOversightRow["weeklyReportStatus"] = "missing";
      if (!reportSnap.empty) {
        const st = reportSnap.docs[0].data().status as string;
        weeklyReportStatus = st === "submitted" ? "submitted" : "draft";
      }

      const agendaQ = query(
        collection(db, COLLECTIONS.staffWeeklyAgendas),
        where("organizationId", "==", organizationId),
        where("staffUid", "==", uid),
        where("weekStart", "==", weekStart),
        limit(1),
      );
      const agendaSnap = await getDocs(agendaQ);
      const weeklyAgendaStatus: StaffOversightRow["weeklyAgendaStatus"] = agendaSnap.empty ? "missing" : "present";

      return {
        staffUid: uid,
        displayName,
        email,
        lastActiveAt,
        tasksDueCount: tasksByStaff.get(uid) ?? 0,
        overduePromptsCount: overduePromptsByStaff.get(uid) ?? 0,
        weeklyReportStatus,
        weeklyAgendaStatus,
      };
    }),
  );

  staffOversight.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    range,
    filters,
    overview,
    activityFeed,
    staffOversight,
  };
}
