"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchAdminReportingSnapshot,
  fetchSegmentFilterOptions,
} from "@/services/firestore/adminReportingService";
import type {
  AdminReportingSnapshot,
  ReportingDateRange,
  ReportingSegmentFilters,
} from "@/types/reporting";

export function defaultReportingDateRange(days = 90): ReportingDateRange {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function useReportingFilterOptions() {
  const { orgId } = useAuth();
  const [schools, setSchools] = useState<{ id: string; label: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; label: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; label: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setSchools([]);
      setPartners([]);
      setPrograms([]);
      setStaff([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const o = await fetchSegmentFilterOptions(orgId);
      setSchools(o.schools);
      setPartners(o.partners);
      setPrograms(o.programs);
      setStaff(o.staff);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { schools, partners, programs, staff, isLoading, error, refetch };
}

export function useAdminReporting(range: ReportingDateRange, segments: ReportingSegmentFilters) {
  const { orgId } = useAuth();
  const [snapshot, setSnapshot] = useState<AdminReportingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setSnapshot(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const s = await fetchAdminReportingSnapshot({
        organizationId: orgId,
        range,
        segments,
      });
      setSnapshot(s);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, range.start, range.end, segments.schoolId, segments.partnerOrgId, segments.programId, segments.staffUid]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { snapshot, isLoading, error, refetch };
}
