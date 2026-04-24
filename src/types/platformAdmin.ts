export type PlatformOrganizationRow = {
  organizationId: string;
  name: string;
  status: "active" | "inactive";
  activeMembers: number;
  activeAdmins: number;
};

export type PlatformOverview = {
  totalOrganizations: number;
  activeOrganizations: number;
  activeMemberships: number;
  organizations: PlatformOrganizationRow[];
};
