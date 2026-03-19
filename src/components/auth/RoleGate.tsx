"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/types/auth";

type RoleGateProps = PropsWithChildren<{
  allow: AppRole[];
}>;

export function RoleGate({ allow, children }: RoleGateProps) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!role || !allow.includes(role)) {
      router.replace(ROUTES.UNAUTHORIZED);
    }
  }, [allow, isInitialized, isAuthenticated, role, router]);

  if (!isInitialized || !isAuthenticated || !role || !allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
