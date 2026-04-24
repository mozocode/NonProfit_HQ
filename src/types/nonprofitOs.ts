import type { Timestamp } from "firebase/firestore";

export type InquiryStatus = "new" | "triaged" | "qualified" | "converted" | "archived";
export type HandoffStatus = "draft" | "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected";
export type EntitlementPlan = "starter" | "growth" | "professional" | "enterprise";

export type InquiryRecord = {
  inquiryId: string;
  organizationId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: "web_form" | "phone" | "partner" | "walk_in" | "other";
  notes: string;
  status: InquiryStatus;
  assignedToUid: string | null;
  convertedFamilyId: string | null;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  metadata?: Record<string, string>;
};

export type ReferralHandoffRecord = {
  handoffId: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  familyId: string | null;
  participantProfileId: string | null;
  summary: string;
  requestedByUid: string;
  status: HandoffStatus;
  acceptedByUid: string | null;
  closedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type SharingConsentRecord = {
  consentId: string;
  organizationId: string;
  handoffId: string;
  participantProfileId: string | null;
  allowedFields: string[];
  grantedByUid: string;
  expiresAt: Timestamp | null;
  revokedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type DocumentSignatureRecord = {
  signatureId: string;
  organizationId: string;
  familyDocumentId: string;
  signerUid: string | null;
  signerName: string;
  signerRole: "client" | "guardian" | "staff" | "witness";
  signedAt: Timestamp;
  signingSessionId: string;
  lockDocumentRevision: string;
  ipAddressHash: string | null;
  createdAt: Timestamp;
};

export type AuditEventRecord = {
  auditEventId: string;
  organizationId: string;
  actorUid: string | null;
  actorEmail: string | null;
  action:
    | "inquiry_created"
    | "inquiry_status_changed"
    | "handoff_created"
    | "handoff_status_changed"
    | "consent_granted"
    | "consent_revoked"
    | "signature_captured"
    | "export_generated"
    | "entitlement_changed";
  entityType: "inquiry" | "handoff" | "consent" | "document" | "export" | "entitlement";
  entityId: string;
  metadata: Record<string, string>;
  createdAt: Timestamp;
};

export type EntitlementRecord = {
  organizationId: string;
  plan: EntitlementPlan;
  enabledFeatures: string[];
  limits: {
    staffSeats: number | null;
    activeCases: number | null;
    monthlyHandoffs: number | null;
  };
  billingStatus: "trial" | "active" | "past_due" | "canceled";
  updatedAt: Timestamp;
  updatedByUid: string;
};

export type UsageMetricRecord = {
  metricId: string;
  organizationId: string;
  metricKey:
    | "inquiry_created"
    | "inquiry_converted"
    | "handoff_sent"
    | "handoff_accepted"
    | "signature_completed"
    | "export_generated";
  amount: number;
  recordedAt: Timestamp;
  recordedByUid: string | null;
  metadata?: Record<string, string>;
};
