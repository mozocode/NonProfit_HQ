import { doc, getDoc } from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { OrgMembership, UserProfile } from "@/types/auth";

function guardFirestore(): NonNullable<typeof firestoreDb> {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function toISO(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

function toUserProfile(data: Record<string, unknown> | undefined): UserProfile | null {
  if (!data) return null;
  return {
    displayName: (data.displayName as string) ?? null,
    email: (data.email as string) ?? null,
    phone: (data.phone as string) ?? null,
    lastActiveAt: toISO(data.lastActiveAt),
  };
}

function toOrgMembership(data: Record<string, unknown> | undefined): OrgMembership | null {
  if (!data || data.active !== true) return null;
  const role = data.role as string;
  if (role !== "admin" && role !== "staff" && role !== "participant") return null;
  return {
    orgId: (data.organizationId ?? data.orgId) as string,
    uid: data.uid as string,
    role,
    programIds: Array.isArray(data.programIds) ? (data.programIds as string[]) : [],
    active: true,
    invitedBy: (data.invitedBy as string) ?? null,
    joinedAt: toISO(data.joinedAt) ?? "",
  };
}

/**
 * Fetches the user profile from Firestore users/{uid}. Use after login for display name, phone, etc.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = guardFirestore();
  const ref = doc(db, COLLECTIONS.profiles, uid);
  const snap = await getDoc(ref);
  return toUserProfile(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
}

/**
 * Fetches organization membership from Firestore orgUsers/{orgId_uid}. Use to validate role and get programIds.
 */
export async function getOrgMembership(orgId: string, uid: string): Promise<OrgMembership | null> {
  const db = guardFirestore();
  const docId = `${orgId}_${uid}`;
  const ref = doc(db, COLLECTIONS.organizationMemberships, docId);
  const snap = await getDoc(ref);
  return toOrgMembership(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
}
