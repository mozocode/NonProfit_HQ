import { useSessionStore } from "@/store/sessionStore";

export function useCurrentSession() {
  return useSessionStore((state) => ({
    initialized: state.initialized,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
}
