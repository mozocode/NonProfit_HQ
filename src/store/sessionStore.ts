import { create } from "zustand";

import type { AuthUser, OrgMembership, SessionState, UserOrganization, UserProfile } from "@/types/auth";

type SessionActions = {
  setInitialized: (initialized: boolean) => void;
  setSession: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setMembership: (membership: OrgMembership | null) => void;
  setOrganizations: (organizations: UserOrganization[]) => void;
  clearSession: () => void;
};

const initialState: SessionState = {
  initialized: false,
  isAuthenticated: false,
  user: null,
  profile: null,
  membership: null,
  organizations: [],
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...initialState,
  setInitialized: (initialized) => set({ initialized }),
  setSession: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setProfile: (profile) => set({ profile }),
  setMembership: (membership) => set({ membership }),
  setOrganizations: (organizations) => set({ organizations }),
  clearSession: () =>
    set({
      user: null,
      profile: null,
      membership: null,
      organizations: [],
      isAuthenticated: false,
      initialized: true,
    }),
}));
