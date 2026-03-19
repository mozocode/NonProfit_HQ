/**
 * Read-only directory lists for admin quick-link pages (schools, partners, schedule).
 */

import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function toIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

export interface AdminSchoolRow {
  schoolId: string;
  name: string;
  updatedAt: string;
}

export interface AdminPartnerRow {
  partnerOrgId: string;
  name: string;
  updatedAt: string;
}

export interface AdminScheduleRow {
  entryId: string;
  staffUid: string;
  startAt: string;
  endAt: string;
  type: string;
  title: string | null;
  familyId: string | null;
}

export async function fetchAdminSchoolsList(organizationId: string): Promise<AdminSchoolRow[]> {
  const db = guardDb();
  const snap = await getDocs(query(collection(db, COLLECTIONS.schools), where("organizationId", "==", organizationId)));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        schoolId: d.id,
        name: (data.name as string) ?? d.id,
        updatedAt: toIso(data.updatedAt),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchAdminPartnersList(organizationId: string): Promise<AdminPartnerRow[]> {
  const db = guardDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.partnerOrganizations), where("organizationId", "==", organizationId)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        partnerOrgId: d.id,
        name: (data.name as string) ?? d.id,
        updatedAt: toIso(data.updatedAt),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchAdminScheduleEntries(organizationId: string, max = 150): Promise<AdminScheduleRow[]> {
  const db = guardDb();
  let snap;
  try {
    snap = await getDocs(
      query(
        collection(db, COLLECTIONS.staffScheduleEntries),
        where("organizationId", "==", organizationId),
        orderBy("startAt", "desc"),
        limit(max),
      ),
    );
  } catch {
    const loose = await getDocs(
      query(collection(db, COLLECTIONS.staffScheduleEntries), where("organizationId", "==", organizationId), limit(max)),
    );
    snap = loose;
  }
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      entryId: d.id,
      staffUid: (data.staffUid as string) ?? "",
      startAt: toIso(data.startAt),
      endAt: toIso(data.endAt),
      type: (data.type as string) ?? "work",
      title: (data.title as string) ?? null,
      familyId: (data.familyId as string) ?? null,
    };
  });
  rows.sort((a, b) => b.startAt.localeCompare(a.startAt));
  return rows.slice(0, max);
}
