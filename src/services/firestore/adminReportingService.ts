/**
 * Admin reporting: aggregates Firestore data for analytics screens.
 * Client-side filtering for date range and segments after targeted queries.
 */

import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type {
  AdminReportingSnapshot,
  ReportingDateRange,
  ReportingSegmentFilters,
  ReportingFilterOption,
} from "@/types/reporting";
import type { ReferralStatus } from "@/types/domain";
import { isoTimestampInRange, linkActiveInRange, reportingDayEnd, reportingDayStart } from "@/lib/reportingFilters";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function toIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

export interface FetchReportingParams {
  organizationId: string;
  range: ReportingDateRange;
  segments: ReportingSegmentFilters;
}

export async function fetchSegmentFilterOptions(organizationId: string): Promise<{
  schools: ReportingFilterOption[];
  partners: ReportingFilterOption[];
  programs: ReportingFilterOption[];
  staff: ReportingFilterOption[];
}> {
  const db = guardDb();
  const [schoolsSnap, partnersSnap, enrollSnap, membersSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.schools), where("organizationId", "==", organizationId))),
    getDocs(query(collection(db, COLLECTIONS.partnerOrganizations), where("organizationId", "==", organizationId))),
    getDocs(query(collection(db, COLLECTIONS.enrollments), where("organizationId", "==", organizationId))),
    getDocs(
      query(
        collection(db, COLLECTIONS.organizationMemberships),
        where("organizationId", "==", organizationId),
        where("active", "==", true)
      )
    ),
  ]);

  const schools = schoolsSnap.docs.map((d) => ({
    id: d.id,
    label: (d.data().name as string) ?? d.id,
  }));

  const partners = partnersSnap.docs.map((d) => ({
    id: d.id,
    label: (d.data().name as string) ?? d.id,
  }));

  const programIds = new Set<string>();
  enrollSnap.docs.forEach((d) => {
    const pid = d.data().programId as string | null;
    if (pid) programIds.add(pid);
  });
  const programs = [...programIds].sort().map((id) => ({ id, label: id }));

  const staff: ReportingFilterOption[] = [];
  for (const docSnap of membersSnap.docs) {
    const role = docSnap.data().role as string;
    if (role !== "staff" && role !== "admin") continue;
    const uid = docSnap.data().uid as string;
    staff.push({ id: uid, label: uid });
  }

  return { schools, partners, programs, staff };
}

/** Exported for admin command center and other org-wide views that share segment logic. */
export async function resolveFamilyIdsForSegments(
  db: ReturnType<typeof guardDb>,
  organizationId: string,
  segments: ReportingSegmentFilters,
  rangeStart: string,
  rangeEnd: string
): Promise<Set<string> | null> {
  const sets: Set<string>[] = [];

  if (segments.schoolId) {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.familySchoolLinks),
        where("organizationId", "==", organizationId),
        where("schoolId", "==", segments.schoolId)
      )
    );
    const ids = new Set<string>();
    snap.docs.forEach((d) => {
      const data = d.data();
      if (
        linkActiveInRange(
          toIso(data.periodStart) || "",
          (data.periodEnd as string) ?? null,
          rangeStart,
          rangeEnd
        )
      ) {
        ids.add(data.familyId as string);
      }
    });
    sets.push(ids);
  }

  if (segments.partnerOrgId) {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.familyPartnerLinks),
        where("organizationId", "==", organizationId),
        where("partnerOrgId", "==", segments.partnerOrgId)
      )
    );
    const ids = new Set<string>();
    snap.docs.forEach((d) => {
      const data = d.data();
      if (
        linkActiveInRange(
          toIso(data.periodStart) || "",
          (data.periodEnd as string) ?? null,
          rangeStart,
          rangeEnd
        )
      ) {
        ids.add(data.familyId as string);
      }
    });
    sets.push(ids);
  }

  if (segments.programId) {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.enrollments), where("organizationId", "==", organizationId))
    );
    const ids = new Set<string>();
    snap.docs.forEach((d) => {
      const data = d.data();
      if ((data.programId as string) === segments.programId) ids.add(data.familyId as string);
    });
    sets.push(ids);
  }

  if (segments.staffUid) {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.staffAssignments),
        where("organizationId", "==", organizationId),
        where("staffUid", "==", segments.staffUid)
      )
    );
    const ids = new Set<string>();
    snap.docs.forEach((d) => ids.add(d.data().familyId as string));
    sets.push(ids);
  }

  if (sets.length === 0) return null;

  let result = sets[0];
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter((x) => sets[i].has(x)));
  }
  return result;
}

/** Resolve segment filters to a family id set using the same date window as reporting (link overlap). */
export async function resolveSegmentFamilyIds(
  organizationId: string,
  segments: ReportingSegmentFilters,
  range: ReportingDateRange
): Promise<Set<string> | null> {
  const db = guardDb();
  return resolveFamilyIdsForSegments(db, organizationId, segments, reportingDayStart(range.start), reportingDayEnd(range.end));
}

export async function fetchAdminReportingSnapshot(params: FetchReportingParams): Promise<AdminReportingSnapshot> {
  const db = guardDb();
  const { organizationId, range, segments } = params;
  const rangeStart = reportingDayStart(range.start);
  const rangeEnd = reportingDayEnd(range.end);

  const segmentFamilyIds = await resolveFamilyIdsForSegments(db, organizationId, segments, rangeStart, rangeEnd);

  const familiesSnap = await getDocs(
    query(collection(db, COLLECTIONS.families), where("organizationId", "==", organizationId))
  );

  let families = familiesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toIso(d.data().createdAt),
    updatedAt: toIso(d.data().updatedAt),
    status: d.data().status as string,
  }));

  if (segmentFamilyIds) {
    families = families.filter((f) => segmentFamilyIds.has(f.id));
  }

  const familyIdSet = new Set(families.map((f) => f.id));

  const familiesServed = families.filter(
    (f) => isoTimestampInRange(f.createdAt, rangeStart, rangeEnd) || isoTimestampInRange(f.updatedAt, rangeStart, rangeEnd)
  );
  const servedFamilySet = new Set(familiesServed.map((f) => f.id));

  const activeCases = families.filter((f) => f.status === "active").length;

  const membersSnap = await getDocs(
    query(collectionGroup(db, COLLECTIONS.familyMembers), where("organizationId", "==", organizationId))
  );
  let participantCount = 0;
  const participantsByFamily = new Map<string, number>();
  membersSnap.docs.forEach((d) => {
    const data = d.data();
    const fid = data.familyId as string;
    if (!familyIdSet.has(fid)) return;
    if (!servedFamilySet.has(fid)) return;
    if (data.isParticipant !== true) return;
    participantCount++;
    participantsByFamily.set(fid, (participantsByFamily.get(fid) ?? 0) + 1);
  });

  const tasksSnap = await getDocs(
    query(collectionGroup(db, COLLECTIONS.goalTasks), where("organizationId", "==", organizationId))
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
      where("status", "==", "missing")
    )
  );
  let missingDocumentsCount = 0;
  reqSnap.docs.forEach((d) => {
    if (familyIdSet.has(d.data().familyId as string)) missingDocumentsCount++;
  });

  const referralsSnap = await getDocs(
    query(collection(db, COLLECTIONS.referrals), where("organizationId", "==", organizationId))
  );
  const referralCounts: Record<string, number> = { pending: 0, completed: 0, declined: 0 };
  const referralTrendMap = new Map<string, { made: number; completed: number }>();
  referralsSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    const refAt = toIso(data.referredAt);
    if (!isoTimestampInRange(refAt, rangeStart, rangeEnd)) return;
    const status = data.status as string;
    referralCounts[status] = (referralCounts[status] ?? 0) + 1;
    const month = refAt.slice(0, 7);
    const cur = referralTrendMap.get(month) ?? { made: 0, completed: 0 };
    cur.made++;
    if (status === "completed") cur.completed++;
    referralTrendMap.set(month, cur);
  });
  const referralsByStatus = Object.entries(referralCounts).map(([status, count]) => ({ status, count }));

  const assignSnap = await getDocs(
    query(collection(db, COLLECTIONS.familyResourceAssignments), where("organizationId", "==", organizationId))
  );
  const assignCounts: Record<string, number> = {};
  assignSnap.docs.forEach((d) => {
    const data = d.data();
    if (!familyIdSet.has(data.familyId as string)) return;
    const assignedAt = toIso(data.assignedAt);
    if (!isoTimestampInRange(assignedAt, rangeStart, rangeEnd)) return;
    const rs = (data.referralStatus as ReferralStatus) ?? "suggested";
    assignCounts[rs] = (assignCounts[rs] ?? 0) + 1;
  });
  const assignmentReferralsByStatus = Object.entries(assignCounts).map(([status, count]) => ({ status, count }));

  const surveysSnap = await getDocs(
    query(collection(db, COLLECTIONS.surveys), where("organizationId", "==", organizationId))
  );
  const activeSurveysCount = surveysSnap.docs.filter((d) => d.data().status === "active").length;

  const responsesSnap = await getDocs(
    query(collection(db, COLLECTIONS.surveyResponses), where("organizationId", "==", organizationId))
  );
  let surveyResponsesInPeriod = 0;
  responsesSnap.docs.forEach((d) => {
    const data = d.data();
    const fam = data.familyId as string | null;
    if (fam && !familyIdSet.has(fam)) return;
    if (!fam && segmentFamilyIds && segmentFamilyIds.size > 0) return;
    const sub = toIso(data.submittedAt);
    if (isoTimestampInRange(sub, rangeStart, rangeEnd)) surveyResponsesInPeriod++;
  });

  const surveyCompletionRateLabel =
    activeSurveysCount === 0
      ? "No active surveys"
      : `${surveyResponsesInPeriod} response${surveyResponsesInPeriod === 1 ? "" : "s"} across ${activeSurveysCount} active survey${activeSurveysCount === 1 ? "" : "s"}`;

  const outcomeSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.outcomeSnapshots),
      where("organizationId", "==", organizationId),
      orderBy("periodStart", "desc"),
      limit(24)
    )
  );
  const outcomeHighlights: string[] = [];
  const outcomesByPeriod: AdminReportingSnapshot["outcomesByPeriod"] = [];
  outcomeSnap.docs.forEach((d) => {
    const data = d.data();
    const ps = toIso(data.periodStart);
    const pe = toIso(data.periodEnd);
    if (pe < rangeStart || ps > rangeEnd) return;
    outcomesByPeriod.push({
      period: ps.slice(0, 7),
      metricName: (data.metricId as string) ?? "Metric",
      value: Number(data.value) || 0,
    });
  });
  outcomesByPeriod.sort((a, b) => b.period.localeCompare(a.period));
  if (outcomesByPeriod.length > 0) {
    const latest = outcomesByPeriod[0];
    outcomeHighlights.push(`Latest tracked outcome (${latest.period}): ${latest.metricName} at ${latest.value}.`);
  } else {
    outcomeHighlights.push("Add outcome snapshots to see trend lines here.");
  }

  const membersStaffSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.organizationMemberships),
      where("organizationId", "==", organizationId),
      where("active", "==", true)
    )
  );
  const staffUids: string[] = [];
  membersStaffSnap.docs.forEach((d) => {
    const role = d.data().role as string;
    if (role === "staff" || role === "admin") staffUids.push(d.data().uid as string);
  });
  const staffCount = staffUids.length;

  const reportsSnap = await getDocs(
    query(collection(db, COLLECTIONS.staffWeeklyReports), where("organizationId", "==", organizationId))
  );
  const reportsInRange = reportsSnap.docs.filter((d) => {
    const sub = toIso(d.data().submittedAt);
    return sub && isoTimestampInRange(sub, rangeStart, rangeEnd) && d.data().status === "submitted";
  });
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerWeek));
  const expected = staffCount * weeks;
  const staffReportComplianceRate = expected > 0 ? Math.round((reportsInRange.length / expected) * 100) : 0;
  const staffReportComplianceDetail = `${reportsInRange.length} report${reportsInRange.length === 1 ? "" : "s"} submitted vs ~${expected} expected (staff × weeks in range).`;

  const schoolLinksSnap = await getDocs(
    query(collection(db, COLLECTIONS.familySchoolLinks), where("organizationId", "==", organizationId))
  );
  const schoolsSnap = await getDocs(query(collection(db, COLLECTIONS.schools), where("organizationId", "==", organizationId)));
  const schoolNames = new Map(schoolsSnap.docs.map((d) => [d.id, (d.data().name as string) ?? d.id]));

  const familiesBySchoolMap = new Map<string, Set<string>>();
  const participantsBySchoolMap = new Map<string, number>();
  schoolLinksSnap.docs.forEach((d) => {
    const data = d.data();
    const sid = data.schoolId as string;
    const fid = data.familyId as string;
    if (!linkActiveInRange(toIso(data.periodStart), (data.periodEnd as string) ?? null, rangeStart, rangeEnd)) return;
    if (segmentFamilyIds && !segmentFamilyIds.has(fid)) return;
    if (!families.find((f) => f.id === fid)) return;
    if (!familiesServed.find((f) => f.id === fid)) return;
    if (!familiesBySchoolMap.has(sid)) familiesBySchoolMap.set(sid, new Set());
    familiesBySchoolMap.get(sid)!.add(fid);
  });
  schoolLinksSnap.docs.forEach((d) => {
    const data = d.data();
    const sid = data.schoolId as string;
    const fid = data.familyId as string;
    if (!linkActiveInRange(toIso(data.periodStart), (data.periodEnd as string) ?? null, rangeStart, rangeEnd)) return;
    if (segmentFamilyIds && !segmentFamilyIds.has(fid)) return;
    if (!familiesServed.find((f) => f.id === fid)) return;
    const pc = participantsByFamily.get(fid) ?? 0;
    participantsBySchoolMap.set(sid, (participantsBySchoolMap.get(sid) ?? 0) + pc);
  });

  const familiesBySchool = [...familiesBySchoolMap.entries()].map(([schoolId, set]) => ({
    schoolId,
    schoolName: schoolNames.get(schoolId) ?? schoolId,
    familiesCount: set.size,
    participantsCount: participantsBySchoolMap.get(schoolId) ?? 0,
  }));

  const participantsBySchool = familiesBySchool;

  const partnerLinksSnap = await getDocs(
    query(collection(db, COLLECTIONS.familyPartnerLinks), where("organizationId", "==", organizationId))
  );
  const partnersSnap2 = await getDocs(
    query(collection(db, COLLECTIONS.partnerOrganizations), where("organizationId", "==", organizationId))
  );
  const partnerNames = new Map(partnersSnap2.docs.map((d) => [d.id, (d.data().name as string) ?? d.id]));
  const participantsByPartnerMap = new Map<string, number>();
  partnerLinksSnap.docs.forEach((d) => {
    const data = d.data();
    const pid = data.partnerOrgId as string;
    const fid = data.familyId as string;
    if (!linkActiveInRange(toIso(data.periodStart), (data.periodEnd as string) ?? null, rangeStart, rangeEnd)) return;
    if (segmentFamilyIds && !segmentFamilyIds.has(fid)) return;
    if (!familiesServed.find((f) => f.id === fid)) return;
    const pc = participantsByFamily.get(fid) ?? 0;
    participantsByPartnerMap.set(pid, (participantsByPartnerMap.get(pid) ?? 0) + pc);
  });
  const participantsByPartner = [...participantsByPartnerMap.entries()].map(([partnerOrgId, participantsCount]) => ({
    partnerOrgId,
    partnerName: partnerNames.get(partnerOrgId) ?? partnerOrgId,
    participantsCount,
  }));

  const referralTrend = [...referralTrendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, made: v.made, completed: v.completed }));

  const staffCompliance: AdminReportingSnapshot["staffCompliance"] = [];
  const reportsByStaff = new Map<string, number>();
  reportsInRange.forEach((d) => {
    const uid = d.data().staffUid as string;
    reportsByStaff.set(uid, (reportsByStaff.get(uid) ?? 0) + 1);
  });
  staffUids.forEach((uid) => {
    const submitted = reportsByStaff.get(uid) ?? 0;
    const complianceRate = weeks > 0 ? Math.round((submitted / weeks) * 100) : 0;
    staffCompliance.push({
      staffUid: uid,
      displayName: uid,
      reportsExpected: weeks,
      reportsSubmitted: submitted,
      complianceRate,
    });
  });

  return {
    range,
    segments,
    totalFamiliesServed: familiesServed.length,
    totalParticipantsServed: participantCount,
    activeCases,
    overdueFollowUps,
    missingDocumentsCount,
    referralsByStatus,
    assignmentReferralsByStatus,
    surveyResponsesInPeriod,
    activeSurveysCount,
    surveyCompletionRateLabel,
    outcomeHighlights,
    staffCount,
    staffReportComplianceRate,
    staffReportComplianceDetail,
    familiesBySchool,
    participantsBySchool,
    participantsByPartner,
    referralTrend,
    outcomesByPeriod,
    staffCompliance,
  };
}
