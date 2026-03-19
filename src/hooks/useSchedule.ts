"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  listScheduleEntryViewsForOrg,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  adminStaffDaySummary,
} from "@/services/firestore/scheduleService";
import type { CreateScheduleEntryInput, ScheduleEntryView, UpdateScheduleEntryInput } from "@/types/schedule";

export function useStaffScheduleRange(rangeStartIso: string, rangeEndIso: string) {
  const { orgId, user } = useAuth();
  const uid = user?.uid ?? null;
  const [entries, setEntries] = useState<ScheduleEntryView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !uid) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await listScheduleEntryViewsForOrg(orgId, rangeStartIso, rangeEndIso, { staffUid: uid }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, uid, rangeStartIso, rangeEndIso]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (input: CreateScheduleEntryInput) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await createScheduleEntry(orgId, uid, input);
      await refetch();
    },
    [orgId, uid, refetch],
  );

  const update = useCallback(
    async (input: UpdateScheduleEntryInput) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await updateScheduleEntry(orgId, uid, input, { asAdmin: false });
      await refetch();
    },
    [orgId, uid, refetch],
  );

  const remove = useCallback(
    async (entryId: string) => {
      if (!orgId || !uid) throw new Error("Not signed in");
      await deleteScheduleEntry(orgId, uid, entryId, { asAdmin: false });
      await refetch();
    },
    [orgId, uid, refetch],
  );

  return { entries, isLoading, error, refetch, create, update, remove };
}

export function useAdminScheduleRange(
  rangeStartIso: string,
  rangeEndIso: string,
  options?: { staffUid?: string | null; enabled?: boolean },
) {
  const { orgId, user } = useAuth();
  const adminUid = user?.uid ?? null;
  const enabled = options?.enabled !== false;
  const [entries, setEntries] = useState<ScheduleEntryView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !enabled) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await listScheduleEntryViewsForOrg(orgId, rangeStartIso, rangeEndIso, { staffUid: options?.staffUid }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, rangeStartIso, rangeEndIso, options?.staffUid, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createForStaff = useCallback(
    async (staffUid: string, input: CreateScheduleEntryInput) => {
      if (!orgId || !adminUid) throw new Error("Not signed in");
      await createScheduleEntry(orgId, staffUid, input);
      await refetch();
    },
    [orgId, adminUid, refetch],
  );

  const updateAny = useCallback(
    async (input: UpdateScheduleEntryInput) => {
      if (!orgId || !adminUid) throw new Error("Not signed in");
      await updateScheduleEntry(orgId, adminUid, input, { asAdmin: true });
      await refetch();
    },
    [orgId, adminUid, refetch],
  );

  const removeAny = useCallback(
    async (entryId: string) => {
      if (!orgId || !adminUid) throw new Error("Not signed in");
      await deleteScheduleEntry(orgId, adminUid, entryId, { asAdmin: true });
      await refetch();
    },
    [orgId, adminUid, refetch],
  );

  return { entries, isLoading, error, refetch, createForStaff, updateAny, removeAny };
}

export function useAdminStaffDaySummary(dayYmd: string) {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminStaffDaySummary>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setRows([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setRows(await adminStaffDaySummary(orgId, dayYmd));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, dayYmd]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, isLoading, error, refetch };
}
