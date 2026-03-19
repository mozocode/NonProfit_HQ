"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import {
  getRemindersForStaff,
  getStaffPrompts,
  getStaffPromptWithActionLog,
  acknowledgeReminder,
  completeStaffPrompt,
  logPromptAction,
} from "@/services/firestore/remindersPromptsService";
import type { ReminderView, StaffActionPromptView, LogActionInput } from "@/types/notifications";

export function useRemindersForStaff(options?: { unacknowledgedOnly?: boolean }) {
  const { orgId, user } = useAuth();
  const [reminders, setReminders] = useState<ReminderView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !user?.uid) {
      setReminders([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await getRemindersForStaff(orgId, user.uid, {
        unacknowledgedOnly: options?.unacknowledgedOnly ?? false,
      });
      setReminders(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setReminders([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, user?.uid, options?.unacknowledgedOnly]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reminders, isLoading, error, refetch };
}

export function useStaffPrompts(options?: { completedOnly?: boolean }) {
  const { orgId, user } = useAuth();
  const [prompts, setPrompts] = useState<StaffActionPromptView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !user?.uid) {
      setPrompts([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await getStaffPrompts(orgId, user.uid, options?.completedOnly ?? false);
      setPrompts(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, user?.uid, options?.completedOnly]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { prompts, isLoading, error, refetch };
}

export function useStaffPromptDetail(promptId: string | null) {
  const { orgId } = useAuth();
  const [prompt, setPrompt] = useState<Awaited<ReturnType<typeof getStaffPromptWithActionLog>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !promptId) {
      setPrompt(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const p = await getStaffPromptWithActionLog(orgId, promptId);
      setPrompt(p);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setPrompt(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, promptId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { prompt, isLoading, error, refetch };
}

export function useAcknowledgeReminder() {
  const { orgId, user } = useAuth();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const acknowledge = useCallback(
    async (reminderId: string) => {
      if (!orgId || !user?.uid) return;
      setIsAcknowledging(true);
      try {
        await acknowledgeReminder(orgId, reminderId, user.uid);
      } finally {
        setIsAcknowledging(false);
      }
    },
    [orgId, user?.uid]
  );

  return { acknowledge, isAcknowledging };
}

export function useCompletePrompt() {
  const { orgId, user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const complete = useCallback(
    async (promptId: string) => {
      if (!orgId || !user?.uid) return;
      setIsCompleting(true);
      try {
        await completeStaffPrompt(orgId, promptId, user.uid);
      } finally {
        setIsCompleting(false);
      }
    },
    [orgId, user?.uid]
  );

  return { complete, isCompleting };
}

export function useLogPromptAction() {
  const { orgId, user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  const logAction = useCallback(
    async (promptId: string, input: LogActionInput) => {
      if (!orgId || !user?.uid) return;
      setIsLogging(true);
      try {
        await logPromptAction(orgId, promptId, user.uid, input);
      } finally {
        setIsLogging(false);
      }
    },
    [orgId, user?.uid]
  );

  return { logAction, isLogging };
}

/** Build "what needs attention" list from unacknowledged reminders and unresolved prompts. */
export function useAttentionSummary() {
  const { reminders, isLoading: remindersLoading, refetch: refetchReminders } = useRemindersForStaff({ unacknowledgedOnly: true });
  const { prompts, isLoading: promptsLoading, refetch: refetchPrompts } = useStaffPrompts({ completedOnly: false });
  const items = useMemo(() => {
    const list: Array<{ id: string; type: "reminder" | "prompt"; title: string; dueAt: string; familyId: string | null; familyName: string | null; href: string; kind: string }> = [];
    reminders.forEach((r) => {
      list.push({
        id: `rem_${r.reminderId}`,
        type: "reminder",
        title: r.title,
        dueAt: r.dueAt,
        familyId: r.familyId,
        familyName: r.familyName,
        href: r.familyId ? ROUTES.STAFF_FAMILY(r.familyId) : ROUTES.STAFF_TASK(r.targetId),
        kind: r.type,
      });
    });
    prompts.forEach((p) => {
      list.push({
        id: `prompt_${p.promptId}`,
        type: "prompt",
        title: p.title,
        dueAt: p.dueAt,
        familyId: p.familyId ?? null,
        familyName: null,
        href: p.type === "missing_weekly_report" ? ROUTES.STAFF_REPORT : ROUTES.STAFF_AGENDA,
        kind: p.type,
      });
    });
    list.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return list;
  }, [reminders, prompts]);

  const refetch = useCallback(() => {
    refetchReminders();
    refetchPrompts();
  }, [refetchReminders, refetchPrompts]);

  return {
    items,
    count: items.length,
    isLoading: remindersLoading || promptsLoading,
    error: null,
    refetch,
  };
}
