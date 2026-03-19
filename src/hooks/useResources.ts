"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getResources, getCategories } from "@/services/firestore/resourcesService";
import type { ResourceView } from "@/types/resources";
import type { ResourceCategory } from "@/types/domain";

export function useResources(filters?: { categoryId?: string | null; search?: string }) {
  const { orgId } = useAuth();
  const [resources, setResources] = useState<ResourceView[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setResources([]);
      setCategories([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const [resList, catList] = await Promise.all([
        getResources(orgId, filters),
        getCategories(orgId),
      ]);
      setResources(resList);
      setCategories(catList);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load resources"));
      setResources([]);
      setCategories([]);
      setStatus("error");
    }
  }, [orgId, filters?.categoryId, filters?.search]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { resources, categories, isLoading: status === "loading", error, refetch };
}
