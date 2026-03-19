export type AppRole = "admin" | "staff" | "participant";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  orgId: string | null;
  role: AppRole | null;
};

/** Firestore users/{uid} document (client-facing profile). */
export type UserProfile = {
  displayName: string | null;
  email: string | null;
  phone: string | null;
  lastActiveAt: string | null;
};

/** Org membership from Firestore orgUsers/{orgId_uid}. */
export type OrgMembership = {
  orgId: string;
  uid: string;
  role: AppRole;
  programIds: string[];
  active: boolean;
  invitedBy: string | null;
  joinedAt: string;
};

export type SessionState = {
  initialized: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  profile: UserProfile | null;
  membership: OrgMembership | null;
};
