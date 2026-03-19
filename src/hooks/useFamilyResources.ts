"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getAssignmentsByFamily } from "@/services/firestore/resourcesService";
import type { AssignedResourceView } from "@/types/resources";

export function useFamilyResources(familyId: string | null) {
  const { orgId } = useAuth();
  const [assignments, setAssignments] = useState<AssignedResourceView[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setAssignments([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getAssignmentsByFamily(orgId, familyId);
      setAssignments(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load assigned resources"));
      setAssignments([]);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assignments, isLoading: status === "loading", error, refetch };
}
