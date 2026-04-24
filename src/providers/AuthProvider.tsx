"use client";

import { useCallback, useEffect, type PropsWithChildren } from "react";

import { PageSpinner } from "@/components/ui/page-spinner";
import { authService } from "@/services/auth/authService";
import { listMyOrganizations } from "@/services/functions/orgSwitcherService";
import { getOrgMembership, getUserProfile } from "@/services/firestore/profileService";
import { useSessionStore } from "@/store/sessionStore";

/**
 * Wraps the app and:
 * - Subscribes to Firebase Auth; on change, updates session (user, profile, membership).
 * - Fetches user profile (users/{uid}) and org membership (orgUsers/{orgId_uid}) after login.
 * - Shows a full-screen loading state until auth is bootstrapped (initialized).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useSessionStore((s) => s.setSession);
  const setProfile = useSessionStore((s) => s.setProfile);
  const setMembership = useSessionStore((s) => s.setMembership);
  const setOrganizations = useSessionStore((s) => s.setOrganizations);
  const setInitialized = useSessionStore((s) => s.setInitialized);
  const clearSession = useSessionStore((s) => s.clearSession);

  const bootstrapUser = useCallback(
    async (uid: string, orgId: string | null) => {
      try {
        const [profile, membership, organizations] = await Promise.all([
          getUserProfile(uid),
          orgId ? getOrgMembership(orgId, uid) : Promise.resolve(null),
          listMyOrganizations(),
        ]);
        setProfile(profile ?? null);
        setMembership(membership ?? null);
        setOrganizations(organizations);
      } catch {
        setProfile(null);
        setMembership(null);
        setOrganizations([]);
      } finally {
        setInitialized(true);
      }
    },
    [setProfile, setMembership, setOrganizations, setInitialized],
  );

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      if (!user) {
        clearSession();
        return;
      }
      setSession(user);
      bootstrapUser(user.uid, user.orgId);
    });
    return unsubscribe;
  }, [clearSession, setSession, bootstrapUser]);

  const initialized = useSessionStore((s) => s.initialized);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <PageSpinner className="min-h-screen" />
      </div>
    );
  }

  return <>{children}</>;
}
