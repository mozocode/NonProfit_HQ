/**
 * Organization membership listing and role updates for admins (Phase 22).
 */

import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { AppRole } from "@/types/auth";
import type { AdminOrgMemberRow } from "@/types/adminManagement";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function tsIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

async function membershipRefForUser(organizationId: string, uid: string) {
  const db = guardDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.organizationMemberships),
      where("organizationId", "==", organizationId),
      where("uid", "==", uid),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  return snap.docs[0].ref;
}

export async function listOrganizationMembers(organizationId: string): Promise<AdminOrgMemberRow[]> {
  const db = guardDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.organizationMemberships),
      where("organizationId", "==", organizationId),
      where("active", "==", true),
    ),
  );
  const rows: AdminOrgMemberRow[] = [];
  for (const s of snap.docs) {
    const d = s.data();
    const role = d.role as string;
    if (role !== "admin" && role !== "staff" && role !== "participant") continue;
    const uid = d.uid as string;
    const pSnap = await getDoc(doc(db, COLLECTIONS.profiles, uid));
    const p = pSnap.exists() ? pSnap.data() : null;
    rows.push({
      uid,
      membershipDocId: s.id,
      role: role as AppRole,
      active: d.active === true,
      programIds: Array.isArray(d.programIds) ? (d.programIds as string[]) : [],
      displayName: (p?.displayName as string) ?? null,
      email: (p?.email as string) ?? null,
      joinedAt: tsIso(d.joinedAt),
    });
  }
  rows.sort((a, b) => (a.email ?? a.uid).localeCompare(b.email ?? b.uid));
  return rows;
}

export async function adminSetMemberRole(organizationId: string, targetUid: string, role: AppRole): Promise<void> {
  const ref = await membershipRefForUser(organizationId, targetUid);
  if (!ref) throw new Error("Membership not found");
  const snap = await getDoc(ref);
  const d = snap.data()!;
  if ((d.organizationId as string) !== organizationId) throw new Error("Membership not found");

  const currentRole = d.role as string;
  if (currentRole === "admin" && role !== "admin") {
    const all = await listOrganizationMembers(organizationId);
    const adminCount = all.filter((m) => m.role === "admin").length;
    if (adminCount <= 1) {
      throw new Error("Cannot change role: organization must keep at least one active admin.");
    }
  }

  await updateDoc(ref, {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function adminSetMemberActive(organizationId: string, targetUid: string, active: boolean, actorUid: string): Promise<void> {
  if (actorUid === targetUid && !active) {
    throw new Error("You cannot deactivate your own membership.");
  }
  const ref = await membershipRefForUser(organizationId, targetUid);
  if (!ref) throw new Error("Membership not found");
  const snap = await getDoc(ref);
  const d = snap.data()!;
  if ((d.organizationId as string) !== organizationId) throw new Error("Membership not found");

  if (!active && (d.role as string) === "admin") {
    const all = await listOrganizationMembers(organizationId);
    const otherAdmins = all.filter((m) => m.role === "admin" && m.uid !== targetUid);
    if (otherAdmins.length < 1) {
      throw new Error("Cannot deactivate the last active admin.");
    }
  }

  await updateDoc(ref, {
    active,
    updatedAt: serverTimestamp(),
  });
}
