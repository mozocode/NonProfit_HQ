"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

/**
 * Auth route group layout: redirects authenticated users to home (role dashboard).
 */
export default function AuthLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace(ROUTES.HOME);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (isInitialized && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
