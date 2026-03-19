/**
 * Organization audit log reads (Phase 22).
 */

import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { AuditLogListItem } from "@/types/adminManagement";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function toIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

export async function listAuditLogsForOrganization(
  organizationId: string,
  options?: { maxRows?: number },
): Promise<AuditLogListItem[]> {
  const db = guardDb();
  const maxRows = options?.maxRows ?? 200;
  const q = query(
    collection(db, COLLECTIONS.auditLogs),
    where("organizationId", "==", organizationId),
    orderBy("createdAt", "desc"),
    limit(maxRows),
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      logId: s.id,
      organizationId: d.organizationId as string,
      action: (d.action as string) ?? "",
      actorUid: (d.actorUid as string) ?? "",
      resourceType: (d.resourceType as string) ?? "",
      resourceId: (d.resourceId as string) ?? "",
      metadata: (d.metadata as Record<string, unknown>) ?? {},
      createdAt: toIso(d.createdAt),
    };
  });
}
