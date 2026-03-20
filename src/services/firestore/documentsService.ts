import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
import { storageService } from "@/services/storage/storageService";
import type {
  RequiredDocumentTemplate,
  FamilyDocument,
  FamilyDocumentRequirement,
} from "@/types/domain";
import type {
  RequiredTemplateView,
  DocumentView,
  RequirementView,
  UploadDocumentInput,
  DocumentsForFamilyResult,
} from "@/types/documents";

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

export async function getRequiredTemplates(organizationId: string): Promise<RequiredTemplateView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.requiredDocumentTemplates);
  const q = query(ref, where("organizationId", "==", organizationId));
  const snap = await getDocs(q);
  const list = snap.docs.map((s) => {
    const d = s.data();
    return {
      templateId: s.id,
      name: (d.name as string) ?? "",
      documentType: (d.documentType as string) ?? "",
      description: (d.description as string) ?? null,
    };
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

async function getTemplateNameMap(organizationId: string): Promise<Map<string, string>> {
  const templates = await getRequiredTemplates(organizationId);
  const map = new Map<string, string>();
  templates.forEach((t) => map.set(t.templateId, t.name));
  return map;
}

export async function getRequirementsByFamily(
  organizationId: string,
  familyId: string
): Promise<RequirementView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyDocumentRequirements);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId)
  );
  const snap = await getDocs(q);
  const templateMap = await getTemplateNameMap(organizationId);
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      requirementId: s.id,
      templateId: (d.templateId as string) ?? "",
      templateName: templateMap.get((d.templateId as string) ?? "") ?? (d.templateId as string),
      status: (d.status as RequirementView["status"]) ?? "missing",
      dueDate: (d.dueDate as string) ?? null,
      completedAt: timestampToIso(d.completedAt) ?? null,
    };
  });
}

async function getMemberNameMap(organizationId: string, familyId: string): Promise<Map<string, string>> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyMembers);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId)
  );
  const snap = await getDocs(q);
  const map = new Map<string, string>();
  snap.docs.forEach((s) => {
    const d = s.data();
    const first = (d.firstName as string) ?? "";
    const last = (d.lastName as string) ?? "";
    map.set(s.id, [first, last].filter(Boolean).join(" ").trim() || s.id);
  });
  return map;
}

export async function getDocumentsByFamily(
  organizationId: string,
  familyId: string
): Promise<DocumentView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyDocuments);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
    orderBy("uploadedAt", "desc")
  );
  const snap = await getDocs(q);
  const [templateMap, memberMap] = await Promise.all([
    getTemplateNameMap(organizationId),
    getMemberNameMap(organizationId, familyId),
  ]);
  return snap.docs.map((s) => {
    const d = s.data();
    const memberId = (d.memberId as string) ?? null;
    return {
      documentId: s.id,
      templateId: (d.templateId as string) ?? "",
      templateName: templateMap.get((d.templateId as string) ?? "") ?? (d.templateId as string),
      fileName: (d.fileName as string) ?? "",
      storagePath: (d.storagePath as string) ?? "",
      memberId,
      memberName: memberId ? memberMap.get(memberId) ?? null : null,
      status: (d.status as DocumentView["status"]) ?? "pending",
      uploadedBy: (d.uploadedBy as string) ?? "",
      uploadedAt: timestampToIso(d.uploadedAt) ?? "",
      contentType: (d.contentType as string) ?? null,
    };
  });
}

export async function getDocumentsForFamily(
  organizationId: string,
  familyId: string
): Promise<DocumentsForFamilyResult> {
  const [requirements, documents] = await Promise.all([
    getRequirementsByFamily(organizationId, familyId),
    getDocumentsByFamily(organizationId, familyId),
  ]);
  return { requirements, documents };
}

/** Get or create a requirement for family+template. Returns requirement id. */
export async function ensureRequirement(
  organizationId: string,
  familyId: string,
  templateId: string,
  createdBy: string,
  dueDate?: string | null
): Promise<string> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.familyDocumentRequirements);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
    where("templateId", "==", templateId)
  );
  const snap = await getDocs(q);
  const now = new Date().toISOString();
  if (snap.docs.length > 0) {
    return snap.docs[0].id;
  }
  const newRef = doc(ref);
  const requirement: Omit<FamilyDocumentRequirement, "requirementId"> = {
    organizationId,
    familyId,
    templateId,
    status: "missing",
    dueDate: dueDate ?? null,
    completedAt: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(newRef, requirement);
  return newRef.id;
}

export async function uploadDocument(
  organizationId: string,
  uploadedBy: string,
  input: UploadDocumentInput
): Promise<string> {
  const db = guardDb();
  const { familyId, templateId, file, memberId = null } = input;
  const docRef = doc(collection(db, COLLECTIONS.familyDocuments));
  const documentId = docRef.id;

  const storagePath = await storageService.uploadFamilyDocument(
    organizationId,
    familyId,
    documentId,
    file
  );

  const now = new Date().toISOString();
  const document: FamilyDocument = {
    organizationId,
    familyId,
    memberId,
    documentId,
    templateId,
    storagePath,
    fileName: file.name,
    contentType: file.type || null,
    uploadedBy,
    uploadedAt: now,
    status: "pending",
    createdBy: uploadedBy,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, document);

  const requirementId = await ensureRequirement(organizationId, familyId, templateId, uploadedBy);
  const reqRef = doc(db, COLLECTIONS.familyDocumentRequirements, requirementId);
  await updateDoc(reqRef, {
    status: "uploaded",
    completedAt: now,
    updatedAt: now,
  });

  return documentId;
}

export async function updateDocumentStatus(
  organizationId: string,
  documentId: string,
  status: "pending" | "approved" | "rejected"
): Promise<void> {
  const db = guardDb();
  const docRef = doc(db, COLLECTIONS.familyDocuments, documentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Document not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Document not in organization");
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
    ...(data.createdBy != null && { createdBy: data.createdBy }),
    ...(data.createdAt != null && { createdAt: data.createdAt }),
  });
}

export async function updateRequirementStatus(
  organizationId: string,
  requirementId: string,
  status: "missing" | "uploaded" | "approved",
  completedAt?: string | null
): Promise<void> {
  const db = guardDb();
  const reqRef = doc(db, COLLECTIONS.familyDocumentRequirements, requirementId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) throw new Error("Requirement not found");
  const data = snap.data();
  if ((data.organizationId as string) !== organizationId) throw new Error("Requirement not in organization");
  await updateDoc(reqRef, {
    status,
    ...(completedAt !== undefined && { completedAt }),
    updatedAt: new Date().toISOString(),
    ...(data.createdBy != null && { createdBy: data.createdBy }),
    ...(data.createdAt != null && { createdAt: data.createdAt }),
  });
}

export async function getDocumentDownloadUrl(storagePath: string): Promise<string> {
  return storageService.getDocumentDownloadUrl(storagePath);
}

// ---- Required document templates (admin, Phase 22) ----

export type AdminRequiredTemplateInput = {
  name: string;
  documentType: string;
  description?: string | null;
};

export async function adminCreateRequiredTemplate(organizationId: string, input: AdminRequiredTemplateInput): Promise<string> {
  const db = guardDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.requiredDocumentTemplates), {
    organizationId,
    name: input.name.trim(),
    documentType: input.documentType.trim(),
    description: input.description?.trim() ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function adminUpdateRequiredTemplate(
  organizationId: string,
  templateId: string,
  input: Partial<AdminRequiredTemplateInput>,
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.requiredDocumentTemplates, templateId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Template not found");
  if ((snap.data().organizationId as string) !== organizationId) throw new Error("Template not found");
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.name != null) patch.name = input.name.trim();
  if (input.documentType != null) patch.documentType = input.documentType.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() ?? null;
  await updateDoc(ref, patch);
}
