"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  adminFetchWeeklyOversightOrgSummary,
  adminFetchWeeklyOversightRows,
} from "@/services/firestore/weeklyOversightService";
import type { WeeklyOversightOrgSummary, WeeklyOversightStaffRow } from "@/types/weeklyOversight";

/**
 * Organization weekly oversight grid + rollup summary.
 */
export function useWeeklyOversight(weekStart: string | null, staffUidFilter: string | null) {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<WeeklyOversightStaffRow[]>([]);
  const [summary, setSummary] = useState<WeeklyOversightOrgSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !weekStart) {
      setRows([]);
      setSummary(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminFetchWeeklyOversightOrgSummary(orgId, weekStart, staffUidFilter);
      setRows(result.rows);
      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRows([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, weekStart, staffUidFilter]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, summary, isLoading, error, refetch };
}

/**
 * Single staff member rows for a week (typically one row).
 */
export function useWeeklyOversightStaff(staffUid: string | null, weekStart: string | null) {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<WeeklyOversightStaffRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !weekStart || !staffUid) {
      setRows([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setRows(await adminFetchWeeklyOversightRows(orgId, weekStart, staffUid));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, weekStart, staffUid]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const row = rows[0] ?? null;

  return { row, rows, isLoading, error, refetch };
}
