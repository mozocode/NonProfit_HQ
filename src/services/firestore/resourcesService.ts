import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { Resource, ResourceCategory, FamilyResourceAssignment, ReferralStatus } from "@/types/domain";
import type { ResourceView, AssignedResourceView } from "@/types/resources";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp)?.toDate === "function") return (value as Timestamp).toDate().toISOString();
  return null;
}

function toResourceView(d: Record<string, unknown>, id: string, categoryName: string | null): ResourceView {
  const contact = (d.contactInfo as Record<string, unknown>) ?? {};
  return {
    resourceId: id,
    name: (d.name as string) ?? "",
    description: (d.description as string) ?? null,
    categoryId: (d.categoryId as string) ?? null,
    categoryName,
    providerPhotoUrl: (d.providerPhotoUrl as string) ?? null,
    providerName: (d.providerName as string) ?? null,
    businessName: (d.businessName as string) ?? null,
    phone: (d.phone as string) ?? (contact.phone as string) ?? null,
    website: (d.website as string) ?? (contact.website as string) ?? null,
    notes: (d.notes as string) ?? null,
  };
}

export async function getCategories(organizationId: string): Promise<ResourceCategory[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.resourceCategories);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    orderBy("sortOrder", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      organizationId: d.organizationId as string,
      categoryId: s.id,
      name: d.name as string,
      sortOrder: (d.sortOrder as number) ?? 0,
      createdAt: timestampToIso(d.createdAt) ?? "",
      updatedAt: timestampToIso(d.updatedAt) ?? "",
    };
  });
}

async function getCategoryMap(organizationId: string): Promise<Map<string, string>> {
  const categories = await getCategories(organizationId);
  const map = new Map<string, string>();
  categories.forEach((c) => map.set(c.categoryId, c.name));
  return map;
}

export async function getResources(
  organizationId: string,
  filters?: { categoryId?: string | null; search?: string },
): Promise<ResourceView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.resources);
  let q = query(
    ref,
    where("organizationId", "==", organizationId),
  );
  if (filters?.categoryId) {
    q = query(ref, where("organizationId", "==", organizationId), where("categoryId", "==", filters.categoryId));
  }
  const snap = await getDocs(q);
  const categoryMap = await getCategoryMap(organizationId);
  let list = snap.docs.map((s) => toResourceView(s.data(), s.id, categoryMap.get(s.data().categoryId as string) ?? null));
  if (filters?.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.providerName?.toLowerCase().includes(term)) ||
        (r.businessName?.toLowerCase().includes(term)) ||
        (r.categoryName?.toLowerCase().includes(term)),
    );
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getResource(
  organizationId: string,
  resourceId: string,
): Promise<ResourceView | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.resources, resourceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  if ((d.organizationId as string) !== organizationId) return null;
  const categoryMap = await getCategoryMap(organizationId);
  return toResourceView(d, snap.id, categoryMap.get(d.categoryId as string) ?? null);
}

export async function getAssignmentsByFamily(
  organizationId: string,
  familyId: string,
): Promise<AssignedResourceView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyResourceAssignments);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
  );
  const snap = await getDocs(q);
  const categoryMap = await getCategoryMap(organizationId);
  const result: AssignedResourceView[] = [];
  for (const s of snap.docs) {
    const d = s.data();
    const resourceId = d.resourceId as string;
    const resourceSnap = await getDoc(doc(db, COLLECTIONS.resources, resourceId));
    const resource = resourceSnap.exists()
      ? toResourceView(resourceSnap.data(), resourceSnap.id, categoryMap.get(resourceSnap.data().categoryId as string) ?? null)
      : null;
    if (!resource) continue;
    const referralStatus = (d.referralStatus as ReferralStatus) ?? "suggested";
    result.push({
      assignmentId: s.id,
      resourceId,
      familyId: d.familyId as string,
      memberId: (d.memberId as string) ?? null,
      referralStatus,
      assignedAt: timestampToIso(d.assignedAt) ?? "",
      assignedBy: d.assignedBy as string,
      resource,
    });
  }
  result.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  return result;
}

/** For participants: only resources assigned to their family. */
export async function getAssignedResourcesForFamily(
  organizationId: string,
  familyId: string,
): Promise<AssignedResourceView[]> {
  return getAssignmentsByFamily(organizationId, familyId);
}

export async function assignResourceToFamily(
  organizationId: string,
  familyId: string,
  resourceId: string,
  assignedBy: string,
  options?: { memberId?: string | null; initialStatus?: ReferralStatus },
): Promise<string> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyResourceAssignments);
  const now = serverTimestamp();
  const docRef = await addDoc(ref, {
    organizationId,
    familyId,
    memberId: options?.memberId ?? null,
    resourceId,
    assignedAt: now,
    assignedBy,
    referralStatus: options?.initialStatus ?? "suggested",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateAssignmentStatus(
  organizationId: string,
  assignmentId: string,
  referralStatus: ReferralStatus,
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.familyResourceAssignments, assignmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Assignment not found");
  const d = snap.data();
  if ((d.organizationId as string) !== organizationId) throw new Error("Assignment not found");
  await updateDoc(ref, { referralStatus, updatedAt: serverTimestamp() });
}

// ---- Admin directory CRUD (Phase 22) ----

export type AdminCreateResourceCategoryInput = { name: string; sortOrder?: number };

export async function adminCreateResourceCategory(
  organizationId: string,
  input: AdminCreateResourceCategoryInput,
): Promise<string> {
  const db = guardDb();
  const existing = await getCategories(organizationId);
  const maxOrder = existing.reduce((m, c) => Math.max(m, c.sortOrder), -1);
  const sortOrder = input.sortOrder ?? maxOrder + 1;
  const now = serverTimestamp();
  const created = await addDoc(collection(db, COLLECTIONS.resourceCategories), {
    organizationId,
    name: input.name.trim(),
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });
  return created.id;
}

export type AdminUpsertResourceInput = {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  providerName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
};

export async function adminCreateResource(organizationId: string, input: AdminUpsertResourceInput): Promise<string> {
  const db = guardDb();
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTIONS.resources), {
    organizationId,
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    categoryId: input.categoryId ?? null,
    providerPhotoUrl: null,
    providerName: input.providerName?.trim() ?? null,
    businessName: input.businessName?.trim() ?? null,
    phone: input.phone?.trim() ?? null,
    website: input.website?.trim() ?? null,
    notes: input.notes?.trim() ?? null,
    contactInfo: {},
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function adminUpdateResource(
  organizationId: string,
  resourceId: string,
  input: Partial<AdminUpsertResourceInput>,
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.resources, resourceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Resource not found");
  if ((snap.data().organizationId as string) !== organizationId) throw new Error("Resource not found");
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.name != null) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() ?? null;
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.providerName !== undefined) patch.providerName = input.providerName?.trim() ?? null;
  if (input.businessName !== undefined) patch.businessName = input.businessName?.trim() ?? null;
  if (input.phone !== undefined) patch.phone = input.phone?.trim() ?? null;
  if (input.website !== undefined) patch.website = input.website?.trim() ?? null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() ?? null;
  await updateDoc(ref, patch);
}

export async function adminUpdateResourceCategory(
  organizationId: string,
  categoryId: string,
  input: { name?: string; sortOrder?: number },
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.resourceCategories, categoryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Category not found");
  if ((snap.data().organizationId as string) !== organizationId) throw new Error("Category not found");
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.name != null) patch.name = input.name.trim();
  if (input.sortOrder != null) patch.sortOrder = input.sortOrder;
  await updateDoc(ref, patch);
}
