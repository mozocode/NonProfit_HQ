import type {
  FamilyProfileData,
  FamilyProfileSummary,
  FamilyMemberView,
  NextRequiredAction,
  RecentInteractionView,
  FamilyGoalView,
  FamilyTaskView,
  FamilyNoteView,
  FamilyDocumentRequirementView,
  FamilyDocumentView,
  FamilyResourceView,
  FamilyTimelineEntryView,
} from "@/types/familyProfile";

const summaryFor = (familyId: string): FamilyProfileSummary => ({
  familyId,
  primaryContactName: "Maria Rivera",
  primaryContactPhone: "+1 555-0101",
  primaryContactEmail: "maria.rivera@example.com",
  status: "active",
  memberCount: 3,
  workflowStage: "assessment",
  assignedStaffNames: ["Jane Smith"],
  servicesActive: ["Case management", "Referrals"],
  demographics: { preferredLanguage: "English", householdSize: 3 },
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-03-17T14:00:00Z",
});

const members: FamilyMemberView[] = [
  {
    memberId: "mem_1",
    firstName: "Maria",
    lastName: "Rivera",
    dateOfBirth: "1985-04-12",
    relationship: "Parent",
    isParticipant: true,
  },
  {
    memberId: "mem_2",
    firstName: "Carlos",
    lastName: "Rivera",
    dateOfBirth: "2010-08-01",
    relationship: "Child",
    isParticipant: true,
  },
  {
    memberId: "mem_3",
    firstName: "Elena",
    lastName: "Rivera",
    dateOfBirth: "2012-03-15",
    relationship: "Child",
    isParticipant: false,
  },
];

const nextAction: NextRequiredAction = {
  id: "task_1",
  type: "task",
  title: "Schedule intake meeting",
  dueDate: "2025-03-19",
  familyId: "fam_1",
};

const recentInteractions: RecentInteractionView[] = [
  {
    interactionId: "int_1",
    type: "visit",
    staffName: "Jane Smith",
    occurredAt: "2025-03-17T14:00:00Z",
    summary: "Home visit – discussed goals and document checklist.",
  },
  {
    interactionId: "int_2",
    type: "call",
    staffName: "Jane Smith",
    occurredAt: "2025-03-15T10:30:00Z",
    summary: "Follow-up on assessment.",
  },
];

const goals: FamilyGoalView[] = [
  {
    goalId: "goal_1",
    goalType: "short_term",
    title: "Complete intake and assessment",
    description: "Finish intake process and initial assessment.",
    status: "active",
    targetDate: "2025-03-31",
    tasksCount: 2,
  },
];

const tasks: FamilyTaskView[] = [
  {
    taskId: "task_1",
    goalId: "goal_1",
    goalTitle: "Complete intake and assessment",
    title: "Schedule intake meeting",
    status: "in_progress",
    dueDate: "2025-03-19",
    assigneeType: "staff",
    assigneeName: "Jane Smith",
    isNextAction: true,
  },
  {
    taskId: "task_2",
    goalId: "goal_1",
    goalTitle: "Complete intake and assessment",
    title: "Upload proof of residency",
    status: "todo",
    dueDate: "2025-03-20",
    assigneeType: "parent",
    assigneeName: "Maria Garcia",
    isNextAction: false,
  },
];

const notes: FamilyNoteView[] = [
  {
    noteId: "note_1",
    content: "Family prefers communication by phone. Available after 5 PM on weekdays.",
    authorName: "Jane Smith",
    visibility: "internal",
    createdAt: "2025-03-17T14:30:00Z",
  },
];

const documentRequirements: FamilyDocumentRequirementView[] = [
  { requirementId: "req_1", templateName: "Proof of residency", status: "missing", dueDate: "2025-03-20" },
  { requirementId: "req_2", templateName: "Proof of income", status: "uploaded", dueDate: "2025-03-12" },
];

const documents: FamilyDocumentView[] = [
  {
    documentId: "doc_1",
    templateId: "tpl_income",
    templateName: "Proof of income",
    fileName: "income_mar2025.pdf",
    memberId: null,
    memberName: null,
    status: "pending",
    uploadedAt: "2025-03-14T09:00:00Z",
  },
];

const resources: FamilyResourceView[] = [
  { resourceId: "res_1", name: "Food bank – Main St", categoryName: "Basic needs", status: "active" },
];

const timeline: FamilyTimelineEntryView[] = [
  { id: "tl_1", type: "interaction", title: "Home visit", description: "Discussed goals and document checklist.", timestamp: "2025-03-17T14:00:00Z" },
  { id: "tl_2", type: "note", title: "Contact preference", description: "Phone after 5 PM.", timestamp: "2025-03-17T14:30:00Z" },
  { id: "tl_3", type: "document", title: "Proof of income uploaded", description: null, timestamp: "2025-03-14T09:00:00Z" },
];

export function getMockFamilyProfileData(familyId: string): FamilyProfileData {
  const summary = summaryFor(familyId);
  return {
    summary: { ...summary, familyId },
    members,
    nextRequiredAction: nextAction,
    recentInteractions,
    goals,
    tasks,
    notes,
    documentRequirements,
    documents,
    resources,
    timeline,
  };
}
