"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getWorkflowState, updateWorkflowStage } from "@/services/firestore/workflowService";
import type { FamilyWorkflowState } from "@/types/workflow";

export function useFamilyWorkflow(familyId: string | null) {
  const { orgId, user } = useAuth();
  const [state, setState] = useState<FamilyWorkflowState | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setState(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const s = await getWorkflowState(orgId, familyId);
      setState(s);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load workflow"));
      setState(null);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateStage = useCallback(
    async (stage: string, note?: string) => {
      if (!orgId || !familyId || !user?.uid) throw new Error("Missing context or auth");
      setIsUpdating(true);
      setError(null);
      try {
        await updateWorkflowStage(orgId, familyId, stage, { enteredBy: user.uid, note });
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to update stage"));
        throw e;
      } finally {
        setIsUpdating(false);
      }
    },
    [orgId, familyId, user?.uid, refetch],
  );

  return { state, isLoading: status === "loading", error, refetch, updateStage, isUpdating };
}
