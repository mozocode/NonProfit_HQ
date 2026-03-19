/**
 * Form payload and Firestore document types for intake, enrollment, and assessment.
 * Stored in Firestore with organizationId and familyId.
 */

export interface IntakeFormData {
  reasonForInitialCall: string;
  whatTheyHaveTried: string;
  presentingChallenges: string;
  demographics: {
    preferredLanguage?: string;
    householdSize?: number;
    numberOfAdults?: number;
    numberOfChildren?: number;
    zipCode?: string;
    [key: string]: unknown;
  };
}

export interface IntakeDocument {
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
  /** Form fields stored for reporting and timeline */
  reasonForInitialCall?: string;
  whatTheyHaveTried?: string;
  presentingChallenges?: string;
  demographics?: Record<string, unknown>;
}

export interface EnrollmentFormData {
  programId: string | null;
  enrollmentNotes: string;
  startDate: string;
  agreedToTerms: boolean;
}

export interface EnrollmentDocument {
  organizationId: string;
  familyId: string;
  enrollmentId: string;
  programId: string | null;
  status: "draft" | "active" | "completed";
  enrollmentNotes?: string;
  startDate: string;
  agreedToTerms: boolean;
  enrolledAt: string | null;
  enrolledBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentFormData {
  assessmentType: string;
  strengths: string;
  needs: string;
  goalsSummary: string;
  recommendedServices: string;
  additionalNotes?: string;
}

export interface AssessmentDocument {
  organizationId: string;
  familyId: string;
  intakeId: string | null;
  assessmentId: string;
  type: string;
  status: "draft" | "in_progress" | "completed";
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Form fields */
  strengths?: string;
  needs?: string;
  goalsSummary?: string;
  recommendedServices?: string;
  additionalNotes?: string;
}
