/**
 * View models and admin filters for weekly agenda / reporting (Phase 19).
 */

import type { AgendaLineItem, StaffReportItem, WeeklySubmissionStatus } from "@/types/domain";

export interface WeeklyAgendaView {
  agendaId: string;
  organizationId: string;
  staffUid: string;
  weekStart: string;
  weekEnd: string;
  plannedMeetings: AgendaLineItem[];
  plannedFamilyFollowUps: AgendaLineItem[];
  plannedReferrals: AgendaLineItem[];
  plannedAdminTasks: AgendaLineItem[];
  notes: string;
  /** Stored in Firestore */
  storedStatus: WeeklySubmissionStatus;
  /** Merged with deadline (draft past due → overdue) */
  displayStatus: WeeklySubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUid: string | null;
  submissionDueAt: string;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReportView {
  reportId: string;
  organizationId: string;
  staffUid: string;
  weekStart: string;
  weekEnd: string;
  items: StaffReportItem[];
  notes: string | null;
  storedStatus: WeeklySubmissionStatus;
  displayStatus: WeeklySubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUid: string | null;
  submissionDueAt: string;
  canEdit: boolean;
  totalHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFamilyOption {
  familyId: string;
  label: string;
}

export interface AdminWeeklyFilters {
  staffUid: string | null;
  weekStart: string | null;
}

export interface AdminWeeklyReportRow {
  reportId: string;
  staffUid: string;
  staffLabel: string;
  weekStart: string;
  weekEnd: string;
  displayStatus: WeeklySubmissionStatus;
  submittedAt: string | null;
  totalHours: number | null;
  itemCount: number;
}

export interface AdminWeeklyAgendaRow {
  agendaId: string;
  staffUid: string;
  staffLabel: string;
  weekStart: string;
  weekEnd: string;
  displayStatus: WeeklySubmissionStatus;
  submittedAt: string | null;
  plannedTotal: number;
}

export interface AdminWeekComparisonRow {
  staffUid: string;
  staffLabel: string;
  weekStart: string;
  weekEnd: string;
  agenda: WeeklyAgendaView | null;
  report: WeeklyReportView | null;
  missingSubmission: boolean;
}
