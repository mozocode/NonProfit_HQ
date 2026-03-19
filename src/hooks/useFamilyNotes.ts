"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getNotesByFamily } from "@/services/firestore/notesInteractionsService";
import type { NoteView } from "@/types/notesInteractions";

export function useFamilyNotes(
  familyId: string | null,
  options?: { visibilityFilter?: "all" | "internal" | "shared" },
) {
  const { orgId } = useAuth();
  const [notes, setNotes] = useState<NoteView[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setNotes([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const list = await getNotesByFamily(orgId, familyId, { visibilityFilter: options?.visibilityFilter });
      setNotes(list);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load notes"));
      setNotes([]);
      setStatus("error");
    }
  }, [orgId, familyId, options?.visibilityFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { notes, isLoading: status === "loading", error, refetch };
}
