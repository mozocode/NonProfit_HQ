import type {
  StaffDashboardData,
  StaffAssignedFamily,
  StaffOverdueFollowUp,
  StaffMissingDocument,
  StaffUpcomingTask,
  StaffReminder,
  StaffRecentCase,
  StaffWeeklyAgendaView,
  StaffScheduleEntryView,
  StaffActionPromptView,
} from "@/types/staffDashboard";

const now = new Date();
const today = now.toISOString().slice(0, 10);
const weekStart = (() => {
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
})();

export const mockAssignedFamilies: StaffAssignedFamily[] = [
  {
    familyId: "fam_1",
    primaryContactName: "Maria Rivera",
    status: "active",
    lastActivityAt: "2025-03-17T14:00:00Z",
    assignedAt: "2025-01-15T00:00:00Z",
  },
  {
    familyId: "fam_2",
    primaryContactName: "James Johnson",
    status: "active",
    lastActivityAt: "2025-03-16T09:30:00Z",
    assignedAt: "2025-02-01T00:00:00Z",
  },
  {
    familyId: "fam_3",
    primaryContactName: "Lin Nguyen",
    status: "active",
    lastActivityAt: null,
    assignedAt: "2025-03-10T00:00:00Z",
  },
];

export const mockOverdueFollowUps: StaffOverdueFollowUp[] = [
  {
    id: "task_1",
    familyId: "fam_1",
    familyName: "Rivera Family",
    title: "Assessment follow-up call",
    dueDate: "2025-03-14",
    type: "task",
  },
  {
    id: "doc_1",
    familyId: "fam_2",
    familyName: "Johnson Family",
    title: "Upload proof of income",
    dueDate: "2025-03-12",
    type: "document",
  },
];

export const mockMissingDocuments: StaffMissingDocument[] = [
  {
    requirementId: "req_1",
    familyId: "fam_1",
    familyName: "Rivera Family",
    templateName: "Proof of residency",
    dueDate: "2025-03-20",
  },
  {
    requirementId: "req_2",
    familyId: "fam_2",
    familyName: "Johnson Family",
    templateName: "Proof of income",
    dueDate: "2025-03-12",
  },
  {
    requirementId: "req_3",
    familyId: "fam_3",
    familyName: "Nguyen Family",
    templateName: "ID verification",
    dueDate: null,
  },
];

export const mockUpcomingTasks: StaffUpcomingTask[] = [
  {
    taskId: "task_2",
    familyId: "fam_1",
    familyName: "Rivera Family",
    title: "Schedule intake meeting",
    status: "in_progress",
    dueDate: "2025-03-19",
    assigneeUid: "staff_uid",
  },
  {
    taskId: "task_3",
    familyId: "fam_3",
    familyName: "Nguyen Family",
    title: "Referral intake call",
    status: "todo",
    dueDate: "2025-03-21",
    assigneeUid: "staff_uid",
  },
  {
    taskId: "task_4",
    familyId: null,
    familyName: null,
    title: "Team sync",
    status: "todo",
    dueDate: "2025-03-18",
    assigneeUid: "staff_uid",
  },
];

export const mockRemindersNeedingAck: StaffReminder[] = [
  {
    reminderId: "rem_1",
    type: "document",
    targetId: "req_1",
    title: "Proof of residency due for Rivera Family",
    dueAt: "2025-03-20T17:00:00Z",
    familyId: "fam_1",
    familyName: "Rivera Family",
    acknowledged: false,
  },
  {
    reminderId: "rem_2",
    type: "task",
    targetId: "task_2",
    title: "Schedule intake meeting - Rivera Family",
    dueAt: "2025-03-19T17:00:00Z",
    familyId: "fam_1",
    familyName: "Rivera Family",
    acknowledged: false,
  },
];

export const mockRecentlyUpdatedCases: StaffRecentCase[] = [
  {
    caseId: "case_1",
    familyId: "fam_1",
    familyName: "Rivera Family",
    updatedAt: "2025-03-17T14:00:00Z",
    stage: "assessment",
  },
  {
    caseId: "case_2",
    familyId: "fam_2",
    familyName: "Johnson Family",
    updatedAt: "2025-03-16T11:00:00Z",
    stage: "enrolled",
  },
];

export const mockThisWeekAgenda: StaffWeeklyAgendaView = {
  weekStart,
  items: [
    { type: "task", title: "Assessment follow-up", familyId: "fam_1", familyName: "Rivera Family", dueAt: "2025-03-17" },
    { type: "task", title: "Upload required documents", familyId: "fam_2", familyName: "Johnson Family", dueAt: "2025-03-18" },
    { type: "task", title: "Referral intake call", familyId: "fam_3", familyName: "Nguyen Family", dueAt: "2025-03-21" },
  ],
};

export const mockTodaysSchedule: StaffScheduleEntryView[] = [
  {
    entryId: "ent_1",
    startAt: "2025-03-18T09:00:00Z",
    endAt: "2025-03-18T09:30:00Z",
    type: "meeting",
    title: "Rivera Family - Home visit",
    familyId: "fam_1",
    familyName: "Rivera Family",
    location: "123 Main St",
  },
  {
    entryId: "ent_2",
    startAt: "2025-03-18T14:00:00Z",
    endAt: "2025-03-18T15:00:00Z",
    type: "work",
    title: "Document review",
    familyId: null,
    familyName: null,
  },
];

export const mockUnresolvedActionPrompts: StaffActionPromptView[] = [
  {
    promptId: "prompt_1",
    type: "report_due",
    dueAt: "2025-03-21T17:00:00Z",
    title: "Submit weekly report (Mar 17–21)",
    completedAt: null,
  },
  {
    promptId: "prompt_2",
    type: "agenda_due",
    dueAt: "2025-03-24T09:00:00Z",
    title: "Submit next week's agenda",
    completedAt: null,
  },
];

export function getMockStaffDashboardData(_organizationId: string, _staffUid: string): StaffDashboardData {
  return {
    summary: {
      assignedFamiliesCount: mockAssignedFamilies.length,
      overdueFollowUpsCount: mockOverdueFollowUps.length,
      missingDocumentsCount: mockMissingDocuments.length,
      upcomingTasksCount: mockUpcomingTasks.length,
      remindersNeedingAckCount: mockRemindersNeedingAck.length,
      unresolvedPromptsCount: mockUnresolvedActionPrompts.length,
    },
    assignedFamilies: mockAssignedFamilies,
    overdueFollowUps: mockOverdueFollowUps,
    missingDocuments: mockMissingDocuments,
    upcomingTasks: mockUpcomingTasks,
    remindersNeedingAck: mockRemindersNeedingAck,
    recentlyUpdatedCases: mockRecentlyUpdatedCases,
    thisWeekAgenda: mockThisWeekAgenda,
    todaysSchedule: mockTodaysSchedule,
    unresolvedActionPrompts: mockUnresolvedActionPrompts,
  };
}
