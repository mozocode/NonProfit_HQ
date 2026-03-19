import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import { isDueDateInWeek, isOpenGoalTaskStatus } from "@/lib/goalTaskUtils";
import type { Goal, GoalTask, TaskHistoryEntry } from "@/types/domain";
import type {
  GoalView,
  TaskView,
  NextActionView,
  CreateGoalInput,
  UpdateGoalInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/goalsTasks";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp)?.toDate === "function") return (value as Timestamp).toDate().toISOString();
  return null;
}

function toGoal(d: Record<string, unknown>, id: string): Goal {
  return {
    organizationId: d.organizationId as string,
    familyId: d.familyId as string,
    goalId: id,
    goalType: (d.goalType as Goal["goalType"]) ?? "short_term",
    title: d.title as string,
    description: (d.description as string) ?? null,
    status: d.status as Goal["status"],
    targetDate: timestampToIso(d.targetDate) ?? (d.targetDate as string) ?? null,
    createdBy: d.createdBy as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
  };
}

function toTask(d: Record<string, unknown>, id: string): GoalTask {
  const history = (d.taskHistory as TaskHistoryEntry[] | undefined) ?? [];
  return {
    organizationId: d.organizationId as string,
    familyId: d.familyId as string,
    goalId: d.goalId as string,
    taskId: id,
    title: d.title as string,
    description: (d.description as string) ?? null,
    status: d.status as GoalTask["status"],
    assigneeType: (d.assigneeType as GoalTask["assigneeType"]) ?? null,
    assigneeId: (d.assigneeId as string) ?? null,
    assignedToUid: (d.assignedToUid as string) ?? null,
    dueDate: timestampToIso(d.dueDate) ?? (d.dueDate as string) ?? null,
    completedAt: timestampToIso(d.completedAt),
    createdBy: d.createdBy as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
    taskHistory: history,
  };
}

function goalsRef(db: ReturnType<typeof guardDb>, familyId: string) {
  return collection(db, COLLECTIONS.families, familyId, COLLECTIONS.goals);
}

function goalRef(db: ReturnType<typeof guardDb>, familyId: string, goalId: string) {
  return doc(db, COLLECTIONS.families, familyId, COLLECTIONS.goals, goalId);
}

function goalTasksRef(db: ReturnType<typeof guardDb>, familyId: string, goalId: string) {
  return collection(db, COLLECTIONS.families, familyId, COLLECTIONS.goals, goalId, COLLECTIONS.goalTasks);
}

function goalTaskRef(db: ReturnType<typeof guardDb>, familyId: string, goalId: string, taskId: string) {
  return doc(db, COLLECTIONS.families, familyId, COLLECTIONS.goals, goalId, COLLECTIONS.goalTasks, taskId);
}

// ---- Goals ----
export async function getGoalsByFamily(organizationId: string, familyId: string): Promise<GoalView[]> {
  const db = guardDb();
  const ref = goalsRef(db, familyId);
  const q = query(ref, where("organizationId", "==", organizationId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const goals: GoalView[] = [];
  for (const s of snap.docs) {
    const g = toGoal(s.data(), s.id);
    const taskSnap = await getDocs(goalTasksRef(db, familyId, s.id));
    goals.push({
      ...g,
      tasksCount: taskSnap.size,
    });
  }
  return goals;
}

export async function getGoal(
  organizationId: string,
  familyId: string,
  goalId: string,
): Promise<GoalView | null> {
  const db = guardDb();
  const ref = goalRef(db, familyId, goalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  if ((d.organizationId as string) !== organizationId) return null;
  const taskSnap = await getDocs(goalTasksRef(db, familyId, goalId));
  return { ...toGoal(d, snap.id), tasksCount: taskSnap.size };
}

export async function createGoal(
  organizationId: string,
  familyId: string,
  createdBy: string,
  input: CreateGoalInput,
): Promise<string> {
  const db = guardDb();
  const ref = doc(goalsRef(db, familyId));
  const now = serverTimestamp();
  await setDoc(ref, {
    organizationId,
    familyId,
    goalId: ref.id,
    goalType: input.goalType ?? "short_term",
    title: input.title,
    description: input.description ?? null,
    status: "active",
    targetDate: input.targetDate ?? null,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateGoal(
  organizationId: string,
  familyId: string,
  goalId: string,
  input: UpdateGoalInput,
): Promise<void> {
  const db = guardDb();
  const ref = goalRef(db, familyId, goalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Goal not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Goal not found");
  await updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

// ---- Tasks ----
export async function getTasksByGoal(
  organizationId: string,
  familyId: string,
  goalId: string,
): Promise<GoalTask[]> {
  const db = guardDb();
  const ref = goalTasksRef(db, familyId, goalId);
  const q = query(ref, where("organizationId", "==", organizationId), orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((s) => toTask(s.data(), s.id));
}

export async function getTasksByFamily(
  organizationId: string,
  familyId: string,
): Promise<GoalTask[]> {
  const db = guardDb();
  const goalsSnap = await getDocs(query(goalsRef(db, familyId), where("organizationId", "==", organizationId)));
  const tasks: GoalTask[] = [];
  for (const g of goalsSnap.docs) {
    const taskSnap = await getDocs(
      query(goalTasksRef(db, familyId, g.id), where("organizationId", "==", organizationId), orderBy("dueDate", "asc")),
    );
    taskSnap.docs.forEach((s) => tasks.push(toTask(s.data(), s.id)));
  }
  return tasks;
}

export async function getTask(
  organizationId: string,
  familyId: string,
  goalId: string,
  taskId: string,
): Promise<GoalTask | null> {
  const db = guardDb();
  const ref = goalTaskRef(db, familyId, goalId, taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  if ((d.organizationId as string) !== organizationId) return null;
  return toTask(d, snap.id);
}

/** Resolve task by taskId only (e.g. from /staff/task/[taskId]). Uses collection group. */
export async function getTaskByTaskId(
  organizationId: string,
  taskId: string,
): Promise<{ task: GoalTask; goal: Goal | null } | null> {
  const db = guardDb();
  const q = query(
    collectionGroup(db, COLLECTIONS.goalTasks),
    where("organizationId", "==", organizationId),
    where("taskId", "==", taskId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const taskDoc = snap.docs[0];
  const data = taskDoc.data();
  const task = toTask({ ...data, taskId }, taskDoc.id);
  const goalSnap = await getDoc(goalRef(db, task.familyId, task.goalId));
  const goal = goalSnap.exists() ? toGoal(goalSnap.data(), goalSnap.id) : null;
  return { task, goal };
}

export async function createTask(
  organizationId: string,
  familyId: string,
  goalId: string,
  createdBy: string,
  input: CreateTaskInput,
): Promise<string> {
  const db = guardDb();
  const ref = doc(goalTasksRef(db, familyId, goalId));
  const now = serverTimestamp();
  await setDoc(ref, {
    organizationId,
    familyId,
    goalId,
    taskId: ref.id,
    title: input.title,
    description: input.description ?? null,
    status: "todo",
    assigneeType: input.assigneeType ?? null,
    assigneeId: input.assigneeId ?? null,
    assignedToUid: input.assigneeType === "staff" ? input.assigneeId : null,
    dueDate: input.dueDate ?? null,
    completedAt: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
    taskHistory: [],
  });
  return ref.id;
}

export async function updateTask(
  organizationId: string,
  familyId: string,
  goalId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<void> {
  const db = guardDb();
  const ref = goalTaskRef(db, familyId, goalId, taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Task not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Task not found");
  const update: Record<string, unknown> = { ...input, updatedAt: serverTimestamp() };
  if (input.status === "done") {
    update.completedAt = serverTimestamp();
  }
  if (input.assigneeType === "staff" && input.assigneeId != null) {
    update.assignedToUid = input.assigneeId;
  }
  await updateDoc(ref, update);
}

export async function addTaskProgressNote(
  organizationId: string,
  familyId: string,
  goalId: string,
  taskId: string,
  staffUid: string,
  note: string,
  action: "note" | "status_change" = "note",
): Promise<void> {
  const db = guardDb();
  const ref = goalTaskRef(db, familyId, goalId, taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Task not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Task not found");
  const history = (data.taskHistory as TaskHistoryEntry[]) ?? [];
  const entry: TaskHistoryEntry = {
    at: new Date().toISOString(),
    by: staffUid,
    action,
    note,
  };
  await updateDoc(ref, {
    taskHistory: [...history, entry],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Open goal tasks with dueDate in [weekStart, weekEnd] (YYYY-MM-DD), grouped by assigned staff uid.
 * Phase 21 weekly oversight — tasks without assignedToUid are omitted.
 */
export async function listOpenTasksDueInWeekByStaff(
  organizationId: string,
  weekStart: string,
  weekEnd: string,
): Promise<Map<string, GoalTask[]>> {
  const db = guardDb();
  const snap = await getDocs(
    query(collectionGroup(db, COLLECTIONS.goalTasks), where("organizationId", "==", organizationId)),
  );
  const map = new Map<string, GoalTask[]>();
  for (const docSnap of snap.docs) {
    const t = toTask(docSnap.data(), docSnap.id);
    if (!isOpenGoalTaskStatus(t.status) || !isDueDateInWeek(t.dueDate, weekStart, weekEnd)) continue;
    const uid = t.assignedToUid;
    if (!uid) continue;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid)!.push(t);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  }
  return map;
}

/** Next action: earliest due task that is todo or in_progress for the family. */
export async function getNextActionForFamily(
  organizationId: string,
  familyId: string,
): Promise<NextActionView | null> {
  const tasks = await getTasksByFamily(organizationId, familyId);
  const pending = tasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  if (pending.length === 0) return null;
  const sorted = pending.sort((a, b) => {
    const aDue = a.dueDate ?? "9999-12-31";
    const bDue = b.dueDate ?? "9999-12-31";
    return aDue.localeCompare(bDue);
  });
  const t = sorted[0];
  const goalSnap = await getDoc(goalRef(guardDb(), familyId, t.goalId));
  const goal = goalSnap.exists() ? goalSnap.data() : null;
  return {
    taskId: t.taskId,
    familyId: t.familyId,
    familyName: null,
    goalId: t.goalId,
    goalTitle: goal?.title as string | null ?? null,
    title: t.title,
    dueDate: t.dueDate,
    status: t.status as "todo" | "in_progress",
    assigneeName: null,
  };
}
