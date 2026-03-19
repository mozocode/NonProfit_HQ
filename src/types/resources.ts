/**
 * Resource directory and referral workflow view types.
 */

import type { ReferralStatus } from "@/types/domain";

export interface ResourceView {
  resourceId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  providerPhotoUrl: string | null;
  providerName: string | null;
  businessName: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

export interface AssignedResourceView {
  assignmentId: string;
  resourceId: string;
  familyId: string;
  memberId: string | null;
  referralStatus: ReferralStatus;
  assignedAt: string;
  assignedBy: string;
  resource: ResourceView;
}

export interface AssignResourceInput {
  resourceId: string;
  familyId: string;
  memberId?: string | null;
  initialStatus?: ReferralStatus;
}
