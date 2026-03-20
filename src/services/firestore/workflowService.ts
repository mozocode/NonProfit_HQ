import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { FamilyWorkflowState, StageHistoryEntry, WorkflowNextAction } from "@/types/workflow";
import { getNextActionForFamily } from "./goalsTasksService";
import { isNextActionOverdue } from "@/lib/workflowUtils";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function toStageHistoryEntry(d: Record<string, unknown>): StageHistoryEntry {
  return {
    stage: (d.stage as string) ?? "",
    enteredAt: timestampToIso(d.enteredAt) ?? (d.enteredAt as string) ?? new Date().toISOString(),
    enteredBy: (d.enteredBy as string) ?? null,
    note: (d.note as string) ?? null,
  };
}

/**
 * Get full workflow state for a family: current stage, stage history,
 * next action (from tasks), and overdue flag.
 */
export async function getWorkflowState(
  organizationId: string,
  familyId: string,
): Promise<FamilyWorkflowState | null> {
  const db = guardDb();
  const familyRef = doc(db, COLLECTIONS.families, familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) return null;

  const currentStage = (data.workflowStage as string) ?? "intake";
  const rawHistory = (data.stageHistory as Record<string, unknown>[] | undefined) ?? [];
  const stageHistory: StageHistoryEntry[] = rawHistory.map((d) => toStageHistoryEntry(d));

  let nextAction: WorkflowNextAction | null = null;
  let isOverdue = false;
  try {
    const next = await getNextActionForFamily(organizationId, familyId);
    if (next) {
      nextAction = {
        id: next.taskId,
        type: "task",
        title: next.title,
        dueDate: next.dueDate,
        familyId: next.familyId,
      };
      isOverdue = isNextActionOverdue(next.dueDate);
    }
  } catch {
    // ignore
  }

  return {
    familyId,
    currentStage,
    stageHistory,
    nextAction,
    isOverdue,
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/**
 * Update family's workflow stage and append to stage history.
 * Preserves immutable fields for Firestore rules.
 */
export async function updateWorkflowStage(
  organizationId: string,
  familyId: string,
  stage: string,
  options?: { enteredBy?: string; note?: string },
): Promise<void> {
  const db = guardDb();
  const familyRef = doc(db, COLLECTIONS.families, familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) throw new Error("Family not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Family not found");

  const existingHistory = (data.stageHistory as Record<string, unknown>[] | undefined) ?? [];
  const newEntry = {
    stage,
    enteredAt: serverTimestamp(),
    enteredBy: options?.enteredBy ?? null,
    note: options?.note ?? null,
  };
  const stageHistory = [...existingHistory, newEntry];

  await updateDoc(familyRef, {
    organizationId: data.organizationId,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    workflowStage: stage,
    stageHistory,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}
