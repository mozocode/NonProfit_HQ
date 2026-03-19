/**
 * Organization document read/update for admins (Phase 22).
 */

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { Organization } from "@/types/domain";
import type { OrgWorkflowStageSetting } from "@/types/adminManagement";
import { WORKFLOW_STAGES } from "@/types/workflow";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function tsIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.organizations, organizationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    organizationId: snap.id,
    name: (d.name as string) ?? "",
    status: (d.status as Organization["status"]) ?? "active",
    settings: (d.settings as Record<string, unknown>) ?? {},
    createdAt: tsIso(d.createdAt),
    updatedAt: tsIso(d.updatedAt),
  };
}

export async function adminUpdateOrganization(
  organizationId: string,
  input: {
    name?: string;
    status?: Organization["status"];
    settings?: Record<string, unknown>;
  },
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.organizations, organizationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Organization not found");
  const prev = snap.data();
  const prevSettings = (prev.settings as Record<string, unknown>) ?? {};
  const nextSettings = input.settings ? { ...prevSettings, ...input.settings } : prevSettings;
  await updateDoc(ref, {
    ...(input.name != null && { name: input.name }),
    ...(input.status != null && { status: input.status }),
    settings: nextSettings,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

export function defaultWorkflowStagesFromConstants(): OrgWorkflowStageSetting[] {
  return WORKFLOW_STAGES.map((id, i) => ({
    id,
    label: id.replace(/_/g, " "),
    order: i,
  }));
}

export async function getOrgWorkflowStages(organizationId: string): Promise<OrgWorkflowStageSetting[]> {
  const org = await getOrganization(organizationId);
  const raw = org?.settings?.workflowStages;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((x, i) => {
        const o = x as Record<string, unknown>;
        const id = String(o.id ?? "");
        const label = String(o.label ?? id);
        const order = typeof o.order === "number" ? o.order : i;
        return { id, label, order };
      })
      .filter((s) => s.id)
      .sort((a, b) => a.order - b.order);
  }
  return defaultWorkflowStagesFromConstants();
}

export async function saveOrgWorkflowStages(organizationId: string, stages: OrgWorkflowStageSetting[]): Promise<void> {
  const normalized = [...stages]
    .map((s, i) => ({ id: s.id.trim(), label: s.label.trim() || s.id.trim(), order: typeof s.order === "number" ? s.order : i }))
    .filter((s) => s.id)
    .sort((a, b) => a.order - b.order);
  await adminUpdateOrganization(organizationId, {
    settings: { workflowStages: normalized },
  });
}
