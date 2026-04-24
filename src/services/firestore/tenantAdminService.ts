import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  type Timestamp,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { DocumentationPackView, InquiryView } from "@/types/tenantAdmin";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function timestampToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate().toISOString();
  return null;
}

export async function listInquiries(organizationId: string): Promise<InquiryView[]> {
  const db = guardDb();
  const q = query(
    collection(db, COLLECTIONS.inquiries),
    where("organizationId", "==", organizationId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      inquiryId: d.id,
      fullName: String(data.fullName ?? ""),
      email: (data.email as string) ?? null,
      phone: (data.phone as string) ?? null,
      source: (data.source as InquiryView["source"]) ?? "other",
      notes: String(data.notes ?? ""),
      status: (data.status as InquiryView["status"]) ?? "new",
      createdAt: timestampToIso(data.createdAt),
      assignedToUid: (data.assignedToUid as string) ?? null,
    };
  });
}

export async function createInquiry(
  organizationId: string,
  payload: {
    fullName: string;
    email?: string;
    phone?: string;
    source?: InquiryView["source"];
    notes?: string;
    createdByUid: string;
  },
): Promise<string> {
  const db = guardDb();
  const created = await addDoc(collection(db, COLLECTIONS.inquiries), {
    organizationId,
    fullName: payload.fullName.trim(),
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    source: payload.source ?? "web_form",
    notes: payload.notes?.trim() || "",
    status: "new",
    assignedToUid: null,
    convertedFamilyId: null,
    createdBy: payload.createdByUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateInquiryStatus(
  organizationId: string,
  inquiryId: string,
  status: InquiryView["status"],
): Promise<void> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.inquiries, inquiryId);
  await updateDoc(ref, { organizationId, status, updatedAt: serverTimestamp() });
}

export async function listDocumentationPacks(organizationId: string): Promise<DocumentationPackView[]> {
  const db = guardDb();
  const q = query(
    collection(db, COLLECTIONS.documentationPacks),
    where("organizationId", "==", organizationId),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      packId: d.id,
      name: String(data.name ?? ""),
      description: String(data.description ?? ""),
      includeIntake: data.includeIntake === true,
      includeEnrollment: data.includeEnrollment === true,
      includeAssessment: data.includeAssessment === true,
      includeCaseNoteTemplate: data.includeCaseNoteTemplate === true,
      includeSignatureStep: data.includeSignatureStep === true,
      updatedAt: timestampToIso(data.updatedAt),
    };
  });
}

export async function createDocumentationPack(
  organizationId: string,
  payload: {
    name: string;
    description?: string;
    includeIntake: boolean;
    includeEnrollment: boolean;
    includeAssessment: boolean;
    includeCaseNoteTemplate: boolean;
    includeSignatureStep: boolean;
    createdByUid: string;
  },
): Promise<string> {
  const db = guardDb();
  const created = await addDoc(collection(db, COLLECTIONS.documentationPacks), {
    organizationId,
    name: payload.name.trim(),
    description: payload.description?.trim() || "",
    includeIntake: payload.includeIntake,
    includeEnrollment: payload.includeEnrollment,
    includeAssessment: payload.includeAssessment,
    includeCaseNoteTemplate: payload.includeCaseNoteTemplate,
    includeSignatureStep: payload.includeSignatureStep,
    createdBy: payload.createdByUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}
