export type InquiryView = {
  inquiryId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: "web_form" | "phone" | "partner" | "walk_in" | "other";
  notes: string;
  status: "new" | "triaged" | "qualified" | "converted" | "archived";
  createdAt: string | null;
  assignedToUid: string | null;
};

export type DocumentationPackView = {
  packId: string;
  name: string;
  description: string;
  includeIntake: boolean;
  includeEnrollment: boolean;
  includeAssessment: boolean;
  includeCaseNoteTemplate: boolean;
  includeSignatureStep: boolean;
  updatedAt: string | null;
};
