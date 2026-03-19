"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { staffDashboardService } from "@/services/staff/staffDashboardService";
import type { StaffDashboardData } from "@/types/staffDashboard";

export function useStaffDashboard() {
  const { orgId, user } = useAuth();
  const staffUid = user?.uid ?? null;

  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!orgId || !staffUid) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await staffDashboardService.getDashboardData(orgId, staffUid);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load dashboard"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, staffUid]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
    orgId,
    staffUid,
  };
}
