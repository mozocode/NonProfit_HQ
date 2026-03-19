"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getInteractionsByFamily } from "@/services/firestore/notesInteractionsService";
import type { InteractionView } from "@/types/notesInteractions";

export function useFamilyInteractions(familyId: string | null) {
  const { orgId } = useAuth();
  const [interactions, setInteractions] = useState<InteractionView[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setInteractions([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getInteractionsByFamily(orgId, familyId);
      setInteractions(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load interactions"));
      setInteractions([]);
      setStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { interactions, isLoading: status === "loading", error, refetch };
}
