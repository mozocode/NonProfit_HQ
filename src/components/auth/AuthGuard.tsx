"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { PageSpinner } from "@/components/ui/page-spinner";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

/**
 * Protects dashboard content: redirects unauthenticated users to sign-in,
 * shows loading while profile/membership is still resolving.
 */
export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, role, orgId } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!role || !orgId) {
      router.replace(ROUTES.CREATE_ORGANIZATION);
    }
  }, [isInitialized, isAuthenticated, role, orgId, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !role || !orgId) {
    return null;
  }

  return <>{children}</>;
}
