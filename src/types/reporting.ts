/**
 * Admin reporting and analytics view models.
 */

export interface ReportingDateRange {
  start: string;
  end: string;
}

export interface ReportingSegmentFilters {
  schoolId: string | null;
  partnerOrgId: string | null;
  programId: string | null;
  staffUid: string | null;
}

export const EMPTY_REPORTING_SEGMENTS: ReportingSegmentFilters = {
  schoolId: null,
  partnerOrgId: null,
  programId: null,
  staffUid: null,
};

export interface ReportingFilterOption {
  id: string;
  label: string;
}

export interface ReferralStatusCount {
  status: string;
  count: number;
}

export interface SchoolServedRow {
  schoolId: string;
  schoolName: string;
  familiesCount: number;
  participantsCount: number;
}

export interface PartnerServedRow {
  partnerOrgId: string;
  partnerName: string;
  participantsCount: number;
}

export interface ReferralTrendRow {
  period: string;
  made: number;
  completed: number;
}

export interface OutcomeTrendRow {
  period: string;
  metricName: string;
  value: number;
}

export interface StaffComplianceRow {
  staffUid: string;
  displayName: string;
  reportsExpected: number;
  reportsSubmitted: number;
  complianceRate: number;
}

export interface AdminReportingSnapshot {
  range: ReportingDateRange;
  segments: ReportingSegmentFilters;
  /** Families with created or updated activity in range (after segment filter). */
  totalFamiliesServed: number;
  /** Participant members in those families (isParticipant), active context. */
  totalParticipantsServed: number;
  activeCases: number;
  overdueFollowUps: number;
  missingDocumentsCount: number;
  referralsByStatus: ReferralStatusCount[];
  assignmentReferralsByStatus: ReferralStatusCount[];
  surveyResponsesInPeriod: number;
  activeSurveysCount: number;
  surveyCompletionRateLabel: string;
  outcomeHighlights: string[];
  staffCount: number;
  staffReportComplianceRate: number;
  staffReportComplianceDetail: string;
  familiesBySchool: SchoolServedRow[];
  participantsBySchool: SchoolServedRow[];
  participantsByPartner: PartnerServedRow[];
  referralTrend: ReferralTrendRow[];
  outcomesByPeriod: OutcomeTrendRow[];
  staffCompliance: StaffComplianceRow[];
}

export interface ReportingExportCard {
  id: string;
  title: string;
  statLabel: string;
  statValue: string;
  body: string;
  footnote?: string;
}

export interface ReportingNarrative {
  headline: string;
  paragraphs: string[];
  bullets: string[];
}
