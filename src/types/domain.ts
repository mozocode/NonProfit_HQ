/**
 * Domain types for the full Firestore data model (Phase 3).
 * All tenant-scoped documents include organizationId.
 * Timestamps are ISO strings in app; Firestore uses Timestamp.
 */

import type { AppRole } from "@/types/auth";

// ---- Core ----
export interface Organization {
  organizationId: string;
  name: string;
  status: "active" | "inactive";
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  organizationId: string;
  uid: string;
  role: AppRole;
  programIds: string[];
  active: boolean;
  invitedBy: string | null;
  joinedAt: string;
  updatedAt: string;
}

export interface Profile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDefinition {
  organizationId: string;
  roleId: string;
  name: string;
  permissions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Families ----
export interface PrimaryContact {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export interface Family {
  organizationId: string;
  familyId: string;
  primaryContact: PrimaryContact;
  status: "active" | "inactive" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  organizationId: string;
  familyId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  relationship: string;
  isParticipant: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantProfile {
  organizationId: string;
  familyId: string;
  participantId: string;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Case management ----
export interface Intake {
  organizationId: string;
  familyId: string;
  intakeId: string;
  programId: string | null;
  status: "draft" | "submitted" | "approved";
  submittedAt: string | null;
  submittedBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  organizationId: string;
  familyId: string;
  intakeId: string | null;
  assessmentId: string;
  type: string;
  status: string;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalType = "long_term" | "short_term";

export interface Goal {
  organizationId: string;
  familyId: string;
  goalId: string;
  goalType: GoalType;
  title: string;
  description: string | null;
  status: "active" | "completed" | "cancelled";
  targetDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskAssigneeType = "staff" | "parent" | "child";

export interface TaskHistoryEntry {
  at: string;
  by: string;
  action: "status_change" | "note" | "assigned" | "due_date_change";
  note?: string;
  meta?: Record<string, unknown>;
}

export interface GoalTask {
  organizationId: string;
  familyId: string;
  goalId: string;
  taskId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "blocked";
  assigneeType: TaskAssigneeType | null;
  assigneeId: string | null;
  assignedToUid: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  taskHistory: TaskHistoryEntry[];
}

export interface StaffAssignment {
  organizationId: string;
  staffUid: string;
  familyId: string | null;
  caseId: string | null;
  programId: string | null;
  role: "primary" | "secondary";
  assignedAt: string;
  assignedBy: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InteractionType =
  | "call"
  | "meeting"
  | "check_in"
  | "referral_follow_up"
  | "visit"
  | "email"
  | "other";

export interface Interaction {
  organizationId: string;
  familyId: string;
  interactionId: string;
  type: InteractionType;
  staffUid: string;
  occurredAt: string;
  summary: string | null;
  durationMinutes: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteType = "update" | "case" | "assessment" | "internal";

export type NoteVisibility = "internal" | "shared";

/** internal = staff-only; shared = participant-safe */
export interface Note {
  organizationId: string;
  familyId: string | null;
  caseId: string | null;
  assessmentId: string | null;
  noteId: string;
  authorUid: string;
  noteType: NoteType;
  visibility: NoteVisibility;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Resources ----
export interface Resource {
  organizationId: string;
  resourceId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  providerPhotoUrl: string | null;
  providerName: string | null;
  businessName: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  contactInfo: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCategory {
  organizationId: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ReferralStatus =
  | "suggested"
  | "referred"
  | "connected"
  | "in_progress"
  | "completed";

export interface FamilyResourceAssignment {
  organizationId: string;
  familyId: string;
  memberId: string | null;
  resourceId: string;
  assignmentId: string;
  assignedAt: string;
  assignedBy: string;
  referralStatus: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  organizationId: string;
  familyId: string;
  resourceId: string | null;
  partnerOrganizationId: string | null;
  referralId: string;
  status: "pending" | "completed" | "declined";
  referredBy: string;
  referredAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Documents ----
export interface RequiredDocumentTemplate {
  organizationId: string;
  templateId: string;
  name: string;
  documentType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyDocument {
  organizationId: string;
  familyId: string;
  memberId: string | null;
  documentId: string;
  templateId: string;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  uploadedBy: string;
  uploadedAt: string;
  status: "pending" | "approved" | "rejected";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyDocumentRequirement {
  organizationId: string;
  familyId: string;
  templateId: string;
  requirementId: string;
  status: "missing" | "uploaded" | "approved";
  dueDate: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRequest {
  organizationId: string;
  familyId: string | null;
  documentId: string | null;
  requestId: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Notifications ----
export type ReminderType =
  | "missing_document"
  | "overdue_follow_up"
  | "pending_referral"
  | "stale_case"
  | "missing_weekly_agenda"
  | "missing_weekly_report"
  | "overdue_admin_action"
  | "task"
  | "document"
  | "interaction";

export interface Reminder {
  organizationId: string;
  reminderId: string;
  type: ReminderType;
  targetId: string;
  familyId: string | null;
  title: string | null;
  assignedToUid: string | null;
  dueAt: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StaffActionPromptType =
  | "missing_document"
  | "overdue_follow_up"
  | "pending_referral"
  | "stale_case"
  | "missing_weekly_agenda"
  | "missing_weekly_report"
  | "overdue_admin_action"
  | "admin_follow_up";

export interface PromptActionLogEntry {
  date: string;
  method: string;
  outcome: string;
  loggedAt: string;
  loggedByUid: string;
}

export interface StaffActionPrompt {
  organizationId: string;
  staffUid: string;
  promptId: string;
  type: StaffActionPromptType;
  dueAt: string;
  completedAt: string | null;
  familyId: string | null;
  targetId: string | null;
  title: string | null;
  createdByUid: string | null;
  actionLog: PromptActionLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface EscalationEvent {
  organizationId: string;
  eventId: string;
  type: string;
  familyId: string | null;
  staffUid: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Surveys and outcomes ----
export type SurveyAudience = "parent" | "child" | "staff";

export interface Survey {
  organizationId: string;
  surveyId: string;
  name: string;
  description: string | null;
  /** Who should complete this survey. */
  audience: SurveyAudience;
  status: "draft" | "active" | "closed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  organizationId: string;
  questionId: string;
  order: number;
  type: "text" | "choice" | "scale";
  questionText: string;
  options: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  organizationId: string;
  surveyId: string;
  responseId: string;
  /** Denormalized from survey for reporting filters. */
  audience: SurveyAudience;
  familyId: string | null;
  respondentUid: string | null;
  respondentMemberId: string | null;
  answers: Record<string, unknown>;
  submittedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutcomeMetric {
  organizationId: string;
  metricId: string;
  name: string;
  type: "count" | "rate" | "scale";
  definition: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutcomeSnapshot {
  organizationId: string;
  metricId: string;
  snapshotId: string;
  periodStart: string;
  periodEnd: string;
  scope: "org" | "program" | "school" | "partner";
  scopeId: string | null;
  value: number;
  dimensions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Admin command center ----
export interface School {
  organizationId: string;
  schoolId: string;
  name: string;
  address: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerOrganization {
  organizationId: string;
  partnerOrgId: string;
  name: string;
  contactInfo: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FamilySchoolLink {
  organizationId: string;
  familyId: string;
  schoolId: string;
  linkId: string;
  periodStart: string;
  periodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyPartnerLink {
  organizationId: string;
  familyId: string;
  partnerOrgId: string;
  linkId: string;
  periodStart: string;
  periodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Weekly agenda / report lifecycle (Phase 19). */
export type WeeklySubmissionStatus = "draft" | "submitted" | "overdue" | "reviewed";

/** Planned row on a weekly agenda. */
export interface AgendaLineItem {
  id: string;
  title: string;
  notes?: string | null;
  /** For meetings / blocks */
  scheduledAt?: string | null;
  familyId?: string | null;
  dueAt?: string | null;
  /** Optional planned hours for admin planned-vs-actual rollups (Phase 21). */
  estimatedHours?: number | null;
}

export interface StaffWeeklyAgenda {
  organizationId: string;
  staffUid: string;
  agendaId: string;
  weekStart: string;
  weekEnd: string;
  plannedMeetings: AgendaLineItem[];
  plannedFamilyFollowUps: AgendaLineItem[];
  plannedReferrals: AgendaLineItem[];
  plannedAdminTasks: AgendaLineItem[];
  notes: string;
  status: WeeklySubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUid: string | null;
  /** Last moment staff can edit/submit (ISO). */
  submissionDueAt: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Legacy shape; optional for back-compat reads */
  items?: Array<{ type: string; title: string; familyId?: string; dueAt?: string }>;
}

export interface StaffWeeklyReport {
  organizationId: string;
  staffUid: string;
  reportId: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string | null;
  status: WeeklySubmissionStatus;
  reviewedAt: string | null;
  reviewedByUid: string | null;
  submissionDueAt: string;
  totalHours: number | null;
  /** Week-level summary notes */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReportActivityCategory =
  | "meeting"
  | "family_follow_up"
  | "referral"
  | "admin"
  | "travel"
  | "other";

export interface StaffReportItem {
  organizationId: string;
  reportId: string;
  itemId: string;
  /** Completed activity description */
  activityDescription: string;
  familyId: string | null;
  location: string | null;
  category: ReportActivityCategory | string;
  /** Decimal hours (e.g. 1.5) */
  hoursSpent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** @deprecated */
  type?: "work" | "hours";
  /** @deprecated use activityDescription */
  description?: string | null;
  /** @deprecated use hoursSpent */
  durationMinutes?: number | null;
}

export interface StaffScheduleEntry {
  organizationId: string;
  /** Primary staff member this block belongs to */
  staffUid: string;
  entryId: string;
  /** Calendar date for agenda grouping (YYYY-MM-DD, local intent) */
  date: string;
  startAt: string;
  endAt: string;
  type: "work" | "meeting" | "leave";
  title: string | null;
  location: string | null;
  /** Linked family / caseload */
  familyId: string | null;
  /** Optional case reference (distinct from family when used) */
  caseId: string | null;
  /** Another staff member (co-facilitation, shadowing, etc.) */
  linkedStaffUid: string | null;
  notes: string | null;
  /** Reserved for future Google Calendar / ICS sync — not used yet */
  syncSource?: "local" | "google" | "outlook";
  externalCalendarEventId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTimesheetSummary {
  organizationId: string;
  staffUid: string;
  summaryId: string;
  periodStart: string;
  periodEnd: string;
  totalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportExport {
  organizationId: string;
  exportId: string;
  type: string;
  filters: Record<string, unknown>;
  format: "csv" | "xlsx";
  status: "pending" | "completed" | "failed";
  storagePath: string | null;
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMetricsSnapshot {
  organizationId: string;
  snapshotId: string;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, number>;
  dimensions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  organizationId: string;
  logId: string;
  action: string;
  actorUid: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
