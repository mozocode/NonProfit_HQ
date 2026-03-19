/**
 * Staff dashboard view types. Align with domain types; used for service responses and UI.
 */

export interface StaffAssignedFamily {
  familyId: string;
  primaryContactName: string;
  status: string;
  lastActivityAt: string | null;
  assignedAt: string;
}

export interface StaffOverdueFollowUp {
  id: string;
  familyId: string;
  familyName: string;
  title: string;
  dueDate: string;
  type: "task" | "interaction" | "document";
}

export interface StaffMissingDocument {
  requirementId: string;
  familyId: string;
  familyName: string;
  templateName: string;
  dueDate: string | null;
}

export interface StaffUpcomingTask {
  taskId: string;
  familyId: string | null;
  familyName: string | null;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  dueDate: string | null;
  assigneeUid: string | null;
}

export interface StaffReminder {
  reminderId: string;
  type: string;
  targetId: string;
  title: string;
  dueAt: string;
  familyId: string | null;
  familyName: string | null;
  acknowledged: boolean;
}

export interface StaffRecentCase {
  caseId: string;
  familyId: string;
  familyName: string;
  updatedAt: string;
  stage: string;
}

export interface StaffAgendaItem {
  type: string;
  title: string;
  familyId?: string;
  familyName?: string;
  dueAt?: string;
}

export interface StaffWeeklyAgendaView {
  weekStart: string;
  items: StaffAgendaItem[];
}

export interface StaffScheduleEntryView {
  entryId: string;
  startAt: string;
  endAt: string;
  type: "work" | "meeting" | "leave";
  title: string | null;
  familyId: string | null;
  familyName: string | null;
  location?: string;
}

export interface StaffActionPromptView {
  promptId: string;
  type: string;
  dueAt: string;
  title: string;
  completedAt: string | null;
  familyId?: string | null;
  targetId?: string | null;
  actionLogCount?: number;
  createdByAdmin?: boolean;
}

export interface StaffDashboardSummary {
  assignedFamiliesCount: number;
  overdueFollowUpsCount: number;
  missingDocumentsCount: number;
  upcomingTasksCount: number;
  remindersNeedingAckCount: number;
  unresolvedPromptsCount: number;
}

export interface StaffDashboardData {
  summary: StaffDashboardSummary;
  assignedFamilies: StaffAssignedFamily[];
  overdueFollowUps: StaffOverdueFollowUp[];
  missingDocuments: StaffMissingDocument[];
  upcomingTasks: StaffUpcomingTask[];
  remindersNeedingAck: StaffReminder[];
  recentlyUpdatedCases: StaffRecentCase[];
  thisWeekAgenda: StaffWeeklyAgendaView | null;
  todaysSchedule: StaffScheduleEntryView[];
  unresolvedActionPrompts: StaffActionPromptView[];
}
