"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { fetchSegmentFilterOptions } from "@/services/firestore/adminReportingService";
import { fetchCommandCenterDashboard } from "@/services/firestore/adminCommandCenterService";
import type { CommandCenterDashboard, CommandCenterDateRange, CommandCenterFilters } from "@/types/commandCenter";

export function defaultCommandCenterRange(days = 30): CommandCenterDateRange {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function useCommandCenterFilterOptions() {
  const { orgId } = useAuth();
  const [schools, setSchools] = useState<{ id: string; label: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; label: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setSchools([]);
      setPartners([]);
      setPrograms([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const o = await fetchSegmentFilterOptions(orgId);
      setSchools(o.schools);
      setPartners(o.partners);
      setPrograms(o.programs);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { schools, partners, programs, isLoading, error, refetch };
}

export function useAdminCommandCenter(range: CommandCenterDateRange, filters: CommandCenterFilters) {
  const { orgId } = useAuth();
  const [data, setData] = useState<CommandCenterDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const dash = await fetchCommandCenterDashboard({
        organizationId: orgId,
        range,
        filters,
      });
      setData(dash);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, range.start, range.end, filters.schoolId, filters.partnerOrgId, filters.programId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
