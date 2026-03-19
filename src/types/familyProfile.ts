/**
 * Family profile view types. Align with domain types; used for service responses and UI.
 */

export interface FamilyProfileSummary {
  familyId: string;
  primaryContactName: string;
  primaryContactPhone: string | null;
  primaryContactEmail: string | null;
  status: "active" | "inactive" | "archived";
  memberCount: number;
  workflowStage: string;
  assignedStaffNames: string[];
  servicesActive: string[];
  demographics?: {
    preferredLanguage?: string;
    householdSize?: number;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberView {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  relationship: string;
  isParticipant: boolean;
}

export interface NextRequiredAction {
  id: string;
  type: "task" | "document" | "interaction";
  title: string;
  dueDate: string | null;
  familyId: string;
}

export interface RecentInteractionView {
  interactionId: string;
  type: "call" | "visit" | "email" | "other";
  staffName: string;
  occurredAt: string;
  summary: string | null;
}

export type GoalType = "long_term" | "short_term";
export type TaskAssigneeType = "staff" | "parent" | "child";

export interface FamilyGoalView {
  goalId: string;
  goalType: GoalType;
  title: string;
  description: string | null;
  status: "active" | "completed" | "cancelled";
  targetDate: string | null;
  tasksCount?: number;
}

export interface FamilyTaskView {
  taskId: string;
  goalId: string;
  goalTitle: string | null;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  dueDate: string | null;
  assigneeType: TaskAssigneeType | null;
  assigneeName: string | null;
  isNextAction?: boolean;
}

export interface FamilyNoteView {
  noteId: string;
  noteType?: string;
  title?: string | null;
  content: string;
  authorName: string;
  visibility: "internal" | "shared";
  createdAt: string;
}

export interface FamilyDocumentView {
  documentId: string;
  templateId: string;
  templateName: string;
  fileName: string;
  memberId: string | null;
  memberName: string | null;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  storagePath?: string;
}

export interface FamilyDocumentRequirementView {
  requirementId: string;
  templateName: string;
  status: "missing" | "uploaded" | "approved";
  dueDate: string | null;
}

export interface FamilyResourceView {
  resourceId: string;
  assignmentId?: string;
  name: string;
  categoryName: string | null;
  status: string;
  referralStatus?: string;
  providerName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  website?: string | null;
}

export interface FamilyTimelineEntryView {
  id: string;
  type: string;
  title: string;
  description: string | null;
  timestamp: string;
}

export interface FamilyProfileData {
  summary: FamilyProfileSummary;
  members: FamilyMemberView[];
  nextRequiredAction: NextRequiredAction | null;
  recentInteractions: RecentInteractionView[];
  goals: FamilyGoalView[];
  tasks: FamilyTaskView[];
  notes: FamilyNoteView[];
  documentRequirements: FamilyDocumentRequirementView[];
  documents: FamilyDocumentView[];
  resources: FamilyResourceView[];
  timeline: FamilyTimelineEntryView[];
}
