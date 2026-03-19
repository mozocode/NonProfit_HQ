"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { familyProfileService } from "@/services/family/familyProfileService";
import type { FamilyProfileData } from "@/types/familyProfile";

export function useFamilyProfile(familyId: string | null) {
  const { orgId } = useAuth();
  const [data, setData] = useState<FamilyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!orgId || !familyId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await familyProfileService.getFamilyProfile(orgId, familyId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load family profile"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, familyId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
