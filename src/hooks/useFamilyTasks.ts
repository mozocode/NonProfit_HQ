"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getTasksByFamily } from "@/services/firestore/goalsTasksService";
import type { GoalTask } from "@/types/domain";

export function useFamilyTasks(familyId: string | null) {
  const { orgId } = useAuth();
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setTasks([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getTasksByFamily(orgId, familyId);
      setTasks(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load tasks"));
      setTasks([]);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tasks, isLoading: status === "loading", error, refetch };
}
