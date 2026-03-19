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
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
