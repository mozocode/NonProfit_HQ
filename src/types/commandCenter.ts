/**
 * Admin Command Center dashboard view models (Phase 18).
 */

export interface CommandCenterDateRange {
  start: string;
  end: string;
}

/** Segment filters (school / partner / program). Date range is separate. */
export interface CommandCenterFilters {
  schoolId: string | null;
  partnerOrgId: string | null;
  programId: string | null;
}

export const EMPTY_COMMAND_CENTER_FILTERS: CommandCenterFilters = {
  schoolId: null,
  partnerOrgId: null,
  programId: null,
};

export interface CommandCenterOverview {
  totalFamilies: number;
  totalParticipants: number;
  activeStaff: number;
  activeCases: number;
  overdueFollowUps: number;
  missingDocuments: number;
  referralsInProgress: number;
  completedReferralsInRange: number;
}

export type ActivityFeedKind = "interaction" | "document" | "referral" | "workflow";

export interface ActivityFeedItem {
  id: string;
  kind: ActivityFeedKind;
  at: string;
  title: string;
  subtitle: string | null;
  actorUid: string | null;
  familyId: string | null;
  href: string | null;
}

export type WeeklyReportUiStatus = "submitted" | "draft" | "missing";
export type WeeklyAgendaUiStatus = "present" | "missing";

export interface StaffOversightRow {
  staffUid: string;
  displayName: string;
  email: string | null;
  lastActiveAt: string | null;
  tasksDueCount: number;
  overduePromptsCount: number;
  weeklyReportStatus: WeeklyReportUiStatus;
  weeklyAgendaStatus: WeeklyAgendaUiStatus;
}

export interface CommandCenterDashboard {
  range: CommandCenterDateRange;
  filters: CommandCenterFilters;
  overview: CommandCenterOverview;
  activityFeed: ActivityFeedItem[];
  staffOversight: StaffOversightRow[];
}
