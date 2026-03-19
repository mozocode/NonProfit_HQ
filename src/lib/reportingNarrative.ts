/**
 * Plain-language summaries and grant/newsletter export blurbs from reporting snapshots.
 */

import type { AdminReportingSnapshot, ReportingExportCard, ReportingNarrative } from "@/types/reporting";

function formatRangeLabel(s: AdminReportingSnapshot): string {
  return `${s.range.start} through ${s.range.end}`;
}

function segmentSummary(s: AdminReportingSnapshot): string {
  const parts: string[] = [];
  if (s.segments.schoolId) parts.push("a selected school");
  if (s.segments.partnerOrgId) parts.push("a selected partner");
  if (s.segments.programId) parts.push("a selected program");
  if (s.segments.staffUid) parts.push("a selected staff member’s caseload");
  if (parts.length === 0) return "the whole organization";
  return parts.join(", ");
}

export function generateReportingNarrative(snapshot: AdminReportingSnapshot): ReportingNarrative {
  const range = formatRangeLabel(snapshot);
  const scope = segmentSummary(snapshot);

  const headline = `What happened for ${scope}?`;

  const p1 = `Between ${range}, we recorded activity for ${snapshot.totalFamiliesServed} famil${
    snapshot.totalFamiliesServed === 1 ? "y" : "ies"
  } and ${snapshot.totalParticipantsServed} participant${
    snapshot.totalParticipantsServed === 1 ? "" : "s"
  }. ${snapshot.activeCases} famil${snapshot.activeCases === 1 ? "y has" : "ies have"} an active case file right now.`;

  const p2 = `Day-to-day operations: ${snapshot.overdueFollowUps} follow-up task${
    snapshot.overdueFollowUps === 1 ? " is" : "s are"
  } overdue, and ${snapshot.missingDocumentsCount} required document${
    snapshot.missingDocumentsCount === 1 ? " is" : "s are"
  } still missing for families in this view. Staff compliance on weekly reports is about ${snapshot.staffReportComplianceRate}% (${snapshot.staffReportComplianceDetail}).`;

  const refTotal = snapshot.referralsByStatus.reduce((a, r) => a + r.count, 0);
  const p3 = `Referrals logged in this period: ${refTotal} total. Survey activity: ${snapshot.surveyCompletionRateLabel}.`;

  const bullets: string[] = [...snapshot.outcomeHighlights];
  if (snapshot.referralsByStatus.length > 0) {
    bullets.push(
      `Referrals by status: ${snapshot.referralsByStatus.map((r) => `${r.status} ${r.count}`).join(" · ")}`,
    );
  }
  if (snapshot.assignmentReferralsByStatus.length > 0) {
    bullets.push(
      `Resource assignments (by workflow status): ${snapshot.assignmentReferralsByStatus
        .map((r) => `${r.status} ${r.count}`)
        .join(" · ")}`,
    );
  }

  return {
    headline,
    paragraphs: [p1, p2, p3],
    bullets,
  };
}

export function buildReportingExportCards(snapshot: AdminReportingSnapshot): ReportingExportCard[] {
  const range = formatRangeLabel(snapshot);
  const scopeNote =
    snapshot.segments.schoolId ||
    snapshot.segments.partnerOrgId ||
    snapshot.segments.programId ||
    snapshot.segments.staffUid
      ? "Figures respect the filters applied (school, partner, program, and/or staff)."
      : "Organization-wide totals (no segment filters).";

  const refTotal = snapshot.referralsByStatus.reduce((a, r) => a + r.count, 0);
  const completed = snapshot.referralsByStatus.find((r) => r.status === "completed")?.count ?? 0;

  return [
    {
      id: "impact-families",
      title: "Impact — families & participants",
      statLabel: "Families served (period)",
      statValue: String(snapshot.totalFamiliesServed),
      body: `From ${range}, ${snapshot.totalFamiliesServed} families had qualifying activity in our system, supporting ${snapshot.totalParticipantsServed} enrolled participants.`,
      footnote: scopeNote,
    },
    {
      id: "operations-health",
      title: "Program operations snapshot",
      statLabel: "Active cases",
      statValue: String(snapshot.activeCases),
      body: `${snapshot.activeCases} families have an active case. ${snapshot.overdueFollowUps} follow-ups are overdue, and ${snapshot.missingDocumentsCount} required documents are still outstanding in this view.`,
      footnote: scopeNote,
    },
    {
      id: "referrals",
      title: "Referrals in period",
      statLabel: "Referrals made",
      statValue: String(refTotal),
      body: `We logged ${refTotal} referral${refTotal === 1 ? "" : "s"} in the selected range, including ${completed} marked completed. Pair with your program story for grant reporting.`,
      footnote: scopeNote,
    },
    {
      id: "staff-compliance",
      title: "Staff accountability",
      statLabel: "Weekly report compliance (approx.)",
      statValue: `${snapshot.staffReportComplianceRate}%`,
      body: `${snapshot.staffCount} staff/admin accounts. ${snapshot.staffReportComplianceDetail}`,
      footnote: scopeNote,
    },
    {
      id: "surveys",
      title: "Feedback & surveys",
      statLabel: "Survey responses (period)",
      statValue: String(snapshot.surveyResponsesInPeriod),
      body: `${snapshot.surveyResponsesInPeriod} survey response${snapshot.surveyResponsesInPeriod === 1 ? "" : "s"} submitted while ${snapshot.activeSurveysCount} survey${snapshot.activeSurveysCount === 1 ? "" : "s"} were active.`,
      footnote: scopeNote,
    },
  ];
}
