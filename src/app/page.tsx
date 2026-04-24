"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { isInitialized, isAuthenticated, role, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!role) {
      router.replace(ROUTES.CREATE_ORGANIZATION);
      return;
    }
    if (role === "admin") {
      if (isSuperAdmin) router.replace(ROUTES.ADMIN);
      else router.replace(ROUTES.STAFF);
    }
    else if (role === "staff") router.replace(ROUTES.STAFF);
    else router.replace(ROUTES.PARTICIPANT);
  }, [isInitialized, isAuthenticated, role, isSuperAdmin, router]);

  return null;
}
