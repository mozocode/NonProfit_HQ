import { create } from "zustand";

import type { AuthUser, OrgMembership, SessionState, UserProfile } from "@/types/auth";

type SessionActions = {
  setInitialized: (initialized: boolean) => void;
  setSession: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setMembership: (membership: OrgMembership | null) => void;
  clearSession: () => void;
};

const initialState: SessionState = {
  initialized: false,
  isAuthenticated: false,
  user: null,
  profile: null,
  membership: null,
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
  clearSession: () =>
    set({
      user: null,
      profile: null,
      membership: null,
      isAuthenticated: false,
      initialized: true,
    }),
}));
