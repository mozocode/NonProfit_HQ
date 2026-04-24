"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

export function SuperAdminGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!isSuperAdmin) {
      router.replace(ROUTES.UNAUTHORIZED);
    }
  }, [isInitialized, isAuthenticated, isSuperAdmin, router]);

  if (!isInitialized || !isAuthenticated || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
