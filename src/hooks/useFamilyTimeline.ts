"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getTimelineByFamily } from "@/services/firestore/notesInteractionsService";
import type { TimelineEntryView } from "@/types/notesInteractions";

export function useFamilyTimeline(
  familyId: string | null,
  options?: { visibilityFilter?: "all" | "internal" | "shared" },
) {
  const { orgId } = useAuth();
  const [entries, setEntries] = useState<TimelineEntryView[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setEntries([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getTimelineByFamily(orgId, familyId, { visibilityFilter: options?.visibilityFilter });
      setEntries(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load timeline"));
      setEntries([]);
      setStatus("error");
    }
  }, [orgId, familyId, options?.visibilityFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { entries, isLoading: status === "loading", error, refetch };
}
