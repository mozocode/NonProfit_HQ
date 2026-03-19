"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getGoal, getTasksByGoal } from "@/services/firestore/goalsTasksService";
import type { Goal, GoalTask } from "@/types/domain";
import type { GoalView } from "@/types/goalsTasks";

export function useGoal(familyId: string | null, goalId: string | null) {
  const { orgId } = useAuth();
  const [goal, setGoal] = useState<GoalView | null>(null);
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId || !goalId) {
      setGoal(null);
      setTasks([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const [goalRes, taskList] = await Promise.all([
        getGoal(orgId, familyId, goalId),
        getTasksByGoal(orgId, familyId, goalId),
      ]);
      setGoal(goalRes ?? null);
      setTasks(taskList);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load goal"));
      setGoal(null);
      setTasks([]);
      setStatus("error");
    }
  }, [orgId, familyId, goalId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { goal, tasks, isLoading: status === "loading", error, refetch };
}
