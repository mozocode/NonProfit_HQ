"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { AdminWeeklyFilters } from "@/types/weeklyPlanning";
import type { SaveWeeklyAgendaInput, ReportItemInput } from "@/services/firestore/weeklyPlanningService";
import {
  fetchWeeklyAgendaView,
  saveWeeklyAgendaDraft,
  submitWeeklyAgenda,
  fetchWeeklyReportView,
  saveWeeklyReportDraft,
  submitWeeklyReport,
  upsertReportItem,
  deleteReportItem,
  fetchStaffFamilyOptions,
  adminListWeeklyReports,
  adminListWeeklyAgendas,
  adminBuildComparisonGrid,
  adminMarkAgendaReviewed,
  adminMarkReportReviewed,
} from "@/services/firestore/weeklyPlanningService";
import type { StaffFamilyOption, WeeklyAgendaView, WeeklyReportView } from "@/types/weeklyPlanning";
import type { AdminWeeklyAgendaRow, AdminWeeklyReportRow, AdminWeekComparisonRow } from "@/types/weeklyPlanning";

export function useStaffFamilyOptions() {
  const { orgId, user } = useAuth();
  const uid = user?.uid ?? null;
  const [options, setOptions] = useState<StaffFamilyOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !uid) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setOptions(await fetchStaffFamilyOptions(orgId, uid));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, uid]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { options, isLoading, error, refetch };
}

export function useWeeklyAgenda(weekStart: string) {
  const { orgId, user } = useAuth();
  const uid = user?.uid ?? null;
  const [agenda, setAgenda] = useState<WeeklyAgendaView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !uid) {
      setAgenda(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setAgenda(await fetchWeeklyAgendaView(orgId, uid, weekStart));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setAgenda(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, uid, weekStart]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveDraft = useCallback(
    async (input: SaveWeeklyAgendaInput) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await saveWeeklyAgendaDraft(orgId, uid, weekStart, input);
      await refetch();
    },
    [orgId, uid, weekStart, refetch],
  );

  const submit = useCallback(async () => {
    if (!orgId || !uid) throw new Error("Not signed in");
    await submitWeeklyAgenda(orgId, uid, weekStart);
    await refetch();
  }, [orgId, uid, weekStart, refetch]);

  return { agenda, isLoading, error, refetch, saveDraft, submit };
}

export function useWeeklyReport(weekStart: string) {
  const { orgId, user } = useAuth();
  const uid = user?.uid ?? null;
  const [report, setReport] = useState<WeeklyReportView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !uid) {
      setReport(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setReport(await fetchWeeklyReportView(orgId, uid, weekStart));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, uid, weekStart]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveNotes = useCallback(
    async (notes: string | null) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await saveWeeklyReportDraft(orgId, uid, weekStart, notes);
      await refetch();
    },
    [orgId, uid, weekStart, refetch],
  );

  const submit = useCallback(async () => {
    if (!orgId || !uid) throw new Error("Not signed in");
    await submitWeeklyReport(orgId, uid, weekStart);
    await refetch();
  }, [orgId, uid, weekStart, refetch]);

  const saveItem = useCallback(
    async (input: ReportItemInput) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await upsertReportItem(orgId, uid, weekStart, input);
      await refetch();
    },
    [orgId, uid, weekStart, refetch],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await deleteReportItem(orgId, uid, weekStart, itemId);
      await refetch();
    },
    [orgId, uid, weekStart, refetch],
  );

  return { report, isLoading, error, refetch, saveNotes, submit, saveItem, removeItem };
}

export function useAdminWeeklySubmissions(filters: AdminWeeklyFilters, comparisonWeekStart: string | null) {
  const { orgId, user } = useAuth();
  const adminUid = user?.uid ?? null;
  const [reports, setReports] = useState<AdminWeeklyReportRow[]>([]);
  const [agendas, setAgendas] = useState<AdminWeeklyAgendaRow[]>([]);
  const [comparison, setComparison] = useState<AdminWeekComparisonRow[]>([]);
  const [nonSubmitters, setNonSubmitters] = useState<{ staffUid: string; staffLabel: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setReports([]);
      setAgendas([]);
      setComparison([]);
      setNonSubmitters([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [r, a] = await Promise.all([
        adminListWeeklyReports(orgId, filters),
        adminListWeeklyAgendas(orgId, filters),
      ]);
      setReports(r);
      setAgendas(a);
      if (comparisonWeekStart) {
        const grid = await adminBuildComparisonGrid(orgId, comparisonWeekStart, filters.staffUid);
        setComparison(grid);
        setNonSubmitters(
          grid.filter((r) => r.missingSubmission).map((r) => ({ staffUid: r.staffUid, staffLabel: r.staffLabel })),
        );
      } else {
        setComparison([]);
        setNonSubmitters([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [orgId, filters.staffUid, filters.weekStart, comparisonWeekStart]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const markAgendaReviewed = useCallback(
    async (agendaId: string) => {
      if (!orgId || !adminUid) throw new Error("Not signed in");
      await adminMarkAgendaReviewed(orgId, agendaId, adminUid);
      await refetch();
    },
    [orgId, adminUid, refetch],
  );

  const markReportReviewed = useCallback(
    async (reportId: string) => {
      if (!orgId || !adminUid) throw new Error("Not signed in");
      await adminMarkReportReviewed(orgId, reportId, adminUid);
      await refetch();
    },
    [orgId, adminUid, refetch],
  );

  return {
    reports,
    agendas,
    comparison,
    nonSubmitters,
    isLoading,
    error,
    refetch,
    markAgendaReviewed,
    markReportReviewed,
  };
}
