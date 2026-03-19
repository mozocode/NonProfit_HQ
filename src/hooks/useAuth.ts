"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants";
import { authService } from "@/services/auth/authService";
import { useSessionStore } from "@/store/sessionStore";

/**
 * Auth hook: session state (user, profile, membership), loading flag, and login/logout actions.
 * Use for role-based UI and sign-out. For route protection, use RoleGate or middleware.
 */
export function useAuth() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const profile = useSessionStore((s) => s.profile);
  const membership = useSessionStore((s) => s.membership);
  const initialized = useSessionStore((s) => s.initialized);
  const clearSession = useSessionStore((s) => s.clearSession);

  const isAuthenticated = Boolean(user);
  const isLoading = !initialized;

  const login = useCallback(
    async (email: string, password: string) => {
      return authService.login(email, password);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
    router.replace(ROUTES.LOGIN);
  }, [clearSession, router]);

  /** Resolved role: token claim, or membership.role, or null. */
  const role = user?.role ?? membership?.role ?? null;
  /** Resolved org: token claim or membership.orgId. */
  const orgId = user?.orgId ?? membership?.orgId ?? null;

  return {
    user,
    profile,
    membership,
    role,
    orgId,
    isAuthenticated,
    isInitialized: initialized,
    isLoading,
    login,
    logout,
  };
}
