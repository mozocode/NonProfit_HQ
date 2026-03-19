"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getGoalsByFamily } from "@/services/firestore/goalsTasksService";
import type { GoalView } from "@/types/goalsTasks";

export function useFamilyGoals(familyId: string | null) {
  const { orgId } = useAuth();
  const [goals, setGoals] = useState<GoalView[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setGoals([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getGoalsByFamily(orgId, familyId);
      setGoals(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load goals"));
      setGoals([]);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { goals, isLoading: status === "loading", error, refetch };
}
