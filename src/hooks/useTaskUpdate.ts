"use client";

import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  updateTask,
  addTaskProgressNote,
} from "@/services/firestore/goalsTasksService";
import type { UpdateTaskInput } from "@/types/goalsTasks";

export function useTaskUpdate(
  familyId: string | null,
  goalId: string | null,
  taskId: string | null,
  onSuccess?: () => void,
) {
  const { orgId, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (input: UpdateTaskInput) => {
      if (!orgId || !familyId || !goalId || !taskId || !user?.uid) {
        throw new Error("Missing context or auth");
      }
      setIsUpdating(true);
      setError(null);
      try {
        await updateTask(orgId, familyId, goalId, taskId, input);
        onSuccess?.();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to update task"));
        throw e;
      } finally {
        setIsUpdating(false);
      }
    },
    [orgId, familyId, goalId, taskId, user?.uid, onSuccess],
  );

  const addNote = useCallback(
    async (note: string, action: "note" | "status_change" = "note") => {
      if (!orgId || !familyId || !goalId || !taskId || !user?.uid) {
        throw new Error("Missing context or auth");
      }
      setIsUpdating(true);
      setError(null);
      try {
        await addTaskProgressNote(orgId, familyId, goalId, taskId, user.uid, note, action);
        onSuccess?.();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to add note"));
        throw e;
      } finally {
        setIsUpdating(false);
      }
    },
    [orgId, familyId, goalId, taskId, user?.uid, onSuccess],
  );

  return { update, addNote, isUpdating, error };
}
