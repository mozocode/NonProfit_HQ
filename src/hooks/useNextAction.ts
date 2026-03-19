"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getNextActionForFamily } from "@/services/firestore/goalsTasksService";
import type { NextActionView } from "@/types/goalsTasks";

export function useNextAction(familyId: string | null) {
  const { orgId } = useAuth();
  const [nextAction, setNextAction] = useState<NextActionView | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setNextAction(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const action = await getNextActionForFamily(orgId, familyId);
      setNextAction(action);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load next action"));
      setNextAction(null);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nextAction, isLoading: status === "loading", error, refetch };
}
