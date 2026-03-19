/**
 * Document and upload view/input types for family and member-level documents.
 */

export type DocumentStatus = "pending" | "approved" | "rejected";
export type RequirementStatus = "missing" | "uploaded" | "approved";

export interface RequiredTemplateView {
  templateId: string;
  name: string;
  documentType: string;
  description: string | null;
}

export interface DocumentView {
  documentId: string;
  templateId: string;
  templateName: string;
  fileName: string;
  storagePath: string;
  memberId: string | null;
  memberName: string | null;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  contentType: string | null;
}

export interface RequirementView {
  requirementId: string;
  templateId: string;
  templateName: string;
  status: RequirementStatus;
  dueDate: string | null;
  completedAt: string | null;
}

export interface UploadDocumentInput {
  familyId: string;
  templateId: string;
  file: File;
  memberId?: string | null;
}

export interface DocumentsForFamilyResult {
  requirements: RequirementView[];
  documents: DocumentView[];
}
