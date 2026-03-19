"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getTaskByTaskId } from "@/services/firestore/goalsTasksService";
import type { Goal, GoalTask } from "@/types/domain";

export function useTask(taskId: string | null) {
  const { orgId } = useAuth();
  const [task, setTask] = useState<GoalTask | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !taskId) {
      setTask(null);
      setGoal(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const result = await getTaskByTaskId(orgId, taskId);
      setTask(result?.task ?? null);
      setGoal(result?.goal ?? null);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load task"));
      setTask(null);
      setGoal(null);
      setStatus("error");
    }
  }, [orgId, taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { task, goal, isLoading: status === "loading", error, refetch };
}
