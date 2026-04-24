import type { AppRole } from "@/types/auth";

export type PlatformUserOrganization = {
  organizationId: string;
  organizationName: string;
  role: AppRole;
  isOrganizationOwner: boolean;
  assignmentType: "owner" | "assigned";
  invitedByUid: string | null;
};

export type PlatformUserRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  organizationCount: number;
  organizations: PlatformUserOrganization[];
};
