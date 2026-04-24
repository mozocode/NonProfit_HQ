"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants";
import { isSuperAdminEmail } from "@/lib/superAdmin";
import { authService } from "@/services/auth/authService";
import { switchActiveOrganization } from "@/services/functions/orgSwitcherService";
import { getOrgMembership } from "@/services/firestore/profileService";
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
  const organizations = useSessionStore((s) => s.organizations);
  const initialized = useSessionStore((s) => s.initialized);
  const setSession = useSessionStore((s) => s.setSession);
  const setMembership = useSessionStore((s) => s.setMembership);
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

  const switchOrganization = useCallback(
    async (nextOrganizationId: string) => {
      await switchActiveOrganization(nextOrganizationId);
      const refreshed = await authService.refreshSessionClaims();
      if (refreshed) {
        setSession(refreshed);
        const refreshedMembership = await getOrgMembership(nextOrganizationId, refreshed.uid);
        setMembership(refreshedMembership);
      }
      router.replace(ROUTES.HOME);
    },
    [router, setMembership, setSession],
  );

  /** Resolved role: token claim, or membership.role, or null. */
  const role = user?.role ?? membership?.role ?? null;
  /** Resolved org: token claim or membership.orgId. */
  const orgId = user?.orgId ?? membership?.orgId ?? null;
  const activeOrganization = organizations.find((org) => org.organizationId === orgId) ?? null;
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  return {
    user,
    profile,
    membership,
    organizations,
    activeOrganization,
    isSuperAdmin,
    role,
    orgId,
    isAuthenticated,
    isInitialized: initialized,
    isLoading,
    login,
    logout,
    switchOrganization,
  };
}
