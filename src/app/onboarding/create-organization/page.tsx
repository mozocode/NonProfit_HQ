"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageSpinner } from "@/components/ui/page-spinner";
import { ROUTES } from "@/constants";
import { CreateOrganizationForm } from "@/features/auth/CreateOrganizationForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isInitialized, isAuthenticated, orgId, role } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (orgId && role) {
      router.replace(ROUTES.HOME);
    }
  }, [isInitialized, isAuthenticated, orgId, role, router]);

  if (!isInitialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <PageSpinner />
      </main>
    );
  }

  if (!isAuthenticated || (orgId && role)) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <CreateOrganizationForm />
    </main>
  );
}
