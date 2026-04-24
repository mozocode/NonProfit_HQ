import "./adminInit";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { auth as authV1 } from "firebase-functions/v1";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { runMissingDocumentReminders } from "./scheduled/missingDocumentReminders";
import { runReminderToPromptEscalation } from "./scheduled/reminderToPromptEscalation";
import { runStaleCaseDetection } from "./scheduled/staleCaseDetection";
import { runDailyOrgSummary } from "./scheduled/dailyOrgSummary";
import { runWeeklyAgendaReminder, runWeeklyAgendaOverdueNotifyAdmin } from "./scheduled/weeklyAgendaReminder";
import { runWeeklyReportReminder, runWeeklyReportOverdueNotifyAdmin } from "./scheduled/weeklyReportReminder";
import { runReportingSnapshots } from "./scheduled/reportingSnapshots";

const db = getFirestore();
const auth = getAuth();
const SUPER_ADMIN_EMAILS = new Set(["mozodevelopment@gmail.com"]);
const INTERNAL_ORGANIZATION_IDS = new Set(["org_demo"]);
const DEFAULT_ENTITLEMENT = {
  plan: "starter",
  enabledFeatures: ["case_timeline", "inquiries", "documentation_packs"],
  limits: {
    staffSeats: 5,
    activeCases: 250,
    monthlyHandoffs: 25,
  },
  billingStatus: "trial",
} as const;

type AppRole = "admin" | "staff" | "participant";

function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "staff" || value === "participant";
}

function isSuperAdminRequest(request: CallableRequest<unknown>): boolean {
  const email = String(request.auth?.token.email ?? "")
    .trim()
    .toLowerCase();
  return SUPER_ADMIN_EMAILS.has(email);
}

async function logAuditEvent(input: {
  organizationId: string;
  actorUid: string | null;
  actorEmail?: string | null;
  action:
    | "inquiry_created"
    | "inquiry_status_changed"
    | "handoff_created"
    | "handoff_status_changed"
    | "consent_granted"
    | "consent_revoked"
    | "signature_captured"
    | "export_generated"
    | "entitlement_changed";
  entityType: "inquiry" | "handoff" | "consent" | "document" | "export" | "entitlement";
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.collection("auditEvents").add({
    organizationId: input.organizationId,
    actorUid: input.actorUid,
    actorEmail: input.actorEmail ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function recordUsageMetric(input: {
  organizationId: string;
  metricKey:
    | "inquiry_created"
    | "inquiry_converted"
    | "handoff_sent"
    | "handoff_accepted"
    | "signature_completed"
    | "export_generated";
  amount?: number;
  recordedByUid?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.collection("usageMetrics").add({
    organizationId: input.organizationId,
    metricKey: input.metricKey,
    amount: input.amount ?? 1,
    recordedAt: FieldValue.serverTimestamp(),
    recordedByUid: input.recordedByUid ?? null,
    metadata: input.metadata ?? {},
  });
}

function slugifyOrganizationName(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "org";
}

async function getExistingMembership(uid: string): Promise<{ organizationId: string; role: AppRole } | null> {
  const snap = await db
    .collection("organizationMemberships")
    .where("uid", "==", uid)
    .where("active", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  const role = data.role;
  if (!isAppRole(role)) return null;
  return {
    organizationId: String(data.organizationId),
    role,
  };
}

async function getMembershipForOrg(uid: string, organizationId: string): Promise<{ role: AppRole; active: boolean } | null> {
  const snap = await db.collection("organizationMemberships").doc(`${organizationId}_${uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  const role = data.role;
  if (!isAppRole(role)) return null;
  return {
    role,
    active: data.active === true,
  };
}

export const authOnCreate = authV1.user().onCreate(async (user) => {
  await db.collection("profiles").doc(user.uid).set(
    {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      phone: user.phoneNumber ?? null,
      lastActiveAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});

type SetOrgClaimsPayload = {
  uid: string;
  orgId: string;
  role: "admin" | "staff" | "participant";
};

export const setOrgUserClaims = onCall<SetOrgClaimsPayload>(
  async (request: CallableRequest<SetOrgClaimsPayload>) => {
    const requester = request.auth;
    if (!requester) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const requesterRole = requester.token.role;
    if (requesterRole !== "admin") {
      throw new HttpsError("permission-denied", "Only admins can set claims.");
    }

    const { uid, orgId, role } = request.data;
    await auth.setCustomUserClaims(uid, { orgId, role });

    await db
      .collection("organizationMemberships")
      .doc(`${orgId}_${uid}`)
      .set(
        {
          organizationId: orgId,
          uid,
          role,
          active: true,
          joinedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return { ok: true };
  },
);

type BootstrapOrganizationPayload = {
  organizationName: string;
};

type BootstrapOrganizationResponse = {
  ok: true;
  organizationId: string;
  role: "admin";
};

export const bootstrapOrganizationForCurrentUser = onCall(
  async (request: CallableRequest<BootstrapOrganizationPayload>): Promise<BootstrapOrganizationResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const uid = request.auth.uid;
    const orgName = String(request.data.organizationName ?? "").trim();
    if (orgName.length < 2) {
      throw new HttpsError("invalid-argument", "Organization name must be at least 2 characters.");
    }
    if (orgName.length > 120) {
      throw new HttpsError("invalid-argument", "Organization name is too long.");
    }

    const existing = await getExistingMembership(uid);
    if (existing) {
      if (existing.role === "admin") {
        await auth.setCustomUserClaims(uid, { orgId: existing.organizationId, role: "admin" });
        return { ok: true, organizationId: existing.organizationId, role: "admin" };
      }
      throw new HttpsError("already-exists", "User already belongs to an organization.");
    }

    const slug = slugifyOrganizationName(orgName);
    const slugDocRef = db.collection("organizationSlugs").doc(slug);
    const orgRef = db.collection("organizations").doc();
    const membershipRef = db.collection("organizationMemberships").doc(`${orgRef.id}_${uid}`);

    await db.runTransaction(async (tx) => {
      const slugSnap = await tx.get(slugDocRef);
      if (slugSnap.exists) {
        throw new HttpsError("already-exists", "Organization name is already in use.");
      }
      tx.create(slugDocRef, {
        slug,
        organizationId: orgRef.id,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      tx.create(orgRef, {
        organizationId: orgRef.id,
        name: orgName,
        status: "active",
        settings: {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      tx.create(membershipRef, {
        organizationId: orgRef.id,
        uid,
        role: "admin",
        active: true,
        programIds: [],
        invitedBy: null,
        joinedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        db.collection("profiles").doc(uid),
        {
          updatedAt: FieldValue.serverTimestamp(),
          lastActiveAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    await auth.setCustomUserClaims(uid, { orgId: orgRef.id, role: "admin" });

    return { ok: true, organizationId: orgRef.id, role: "admin" };
  },
);

type ListMyOrganizationsResponse = {
  organizations: Array<{
    organizationId: string;
    name: string;
    role: AppRole;
  }>;
};

export const listMyOrganizations = onCall(
  async (request: CallableRequest<Record<string, never>>): Promise<ListMyOrganizationsResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const membershipSnap = await db
      .collection("organizationMemberships")
      .where("uid", "==", uid)
      .where("active", "==", true)
      .get();

    const organizations: ListMyOrganizationsResponse["organizations"] = [];
    for (const docSnap of membershipSnap.docs) {
      const data = docSnap.data();
      if (!isAppRole(data.role)) continue;
      const organizationId = String(data.organizationId ?? "");
      if (!organizationId || INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;
      const orgSnap = await db.collection("organizations").doc(organizationId).get();
      const orgData = orgSnap.exists ? orgSnap.data() : undefined;
      organizations.push({
        organizationId,
        name: String(orgData?.name ?? organizationId),
        role: data.role,
      });
    }

    organizations.sort((a, b) => a.name.localeCompare(b.name));
    return { organizations };
  },
);

type SwitchActiveOrganizationPayload = {
  organizationId: string;
};

type SwitchActiveOrganizationResponse = {
  ok: true;
  organizationId: string;
  role: AppRole;
};

export const switchActiveOrganization = onCall(
  async (request: CallableRequest<SwitchActiveOrganizationPayload>): Promise<SwitchActiveOrganizationResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const organizationId = String(request.data.organizationId ?? "").trim();
    if (!organizationId) {
      throw new HttpsError("invalid-argument", "organizationId is required.");
    }
    const membership = await getMembershipForOrg(uid, organizationId);
    if (!membership || !membership.active) {
      throw new HttpsError("permission-denied", "No active membership for this organization.");
    }
    await auth.setCustomUserClaims(uid, { orgId: organizationId, role: membership.role });
    return { ok: true, organizationId, role: membership.role };
  },
);

type PlatformOrganizationRow = {
  organizationId: string;
  name: string;
  status: "active" | "inactive";
  activeMembers: number;
  activeAdmins: number;
};

type PlatformOverviewResponse = {
  totalOrganizations: number;
  activeOrganizations: number;
  activeMemberships: number;
  organizations: PlatformOrganizationRow[];
};

export const getPlatformOverview = onCall(
  async (request: CallableRequest<Record<string, never>>): Promise<PlatformOverviewResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    if (!isSuperAdminRequest(request)) {
      throw new HttpsError("permission-denied", "Super admin required.");
    }

    const organizationsSnap = await db.collection("organizations").get();
    const membershipsSnap = await db
      .collection("organizationMemberships")
      .where("active", "==", true)
      .get();

    const memberCounts = new Map<string, number>();
    const adminCounts = new Map<string, number>();
    let filteredActiveMemberships = 0;
    for (const m of membershipsSnap.docs) {
      const data = m.data();
      const organizationId = String(data.organizationId ?? "");
      if (!organizationId || INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;
      filteredActiveMemberships += 1;
      memberCounts.set(organizationId, (memberCounts.get(organizationId) ?? 0) + 1);
      if (data.role === "admin") {
        adminCounts.set(organizationId, (adminCounts.get(organizationId) ?? 0) + 1);
      }
    }

    const organizations: PlatformOrganizationRow[] = organizationsSnap.docs
      .map((d) => {
        const data = d.data();
        const organizationId = String(data.organizationId ?? d.id);
        if (INTERNAL_ORGANIZATION_IDS.has(organizationId)) return null;
        const status = data.status === "inactive" ? "inactive" : "active";
        return {
          organizationId,
          name: String(data.name ?? organizationId),
          status,
          activeMembers: memberCounts.get(organizationId) ?? 0,
          activeAdmins: adminCounts.get(organizationId) ?? 0,
        };
      })
      .filter((x): x is PlatformOrganizationRow => x != null);

    organizations.sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalOrganizations: organizations.length,
      activeOrganizations: organizations.filter((o) => o.status === "active").length,
      activeMemberships: filteredActiveMemberships,
      organizations,
    };
  },
);

type PlatformUserOrganization = {
  organizationId: string;
  organizationName: string;
  role: AppRole;
  isOrganizationOwner: boolean;
  assignmentType: "owner" | "assigned";
  invitedByUid: string | null;
};

type PlatformUserRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDisabled: boolean;
  organizationCount: number;
  organizations: PlatformUserOrganization[];
};

type PlatformUsersResponse = {
  users: PlatformUserRow[];
};

export const getPlatformUsers = onCall(
  async (request: CallableRequest<Record<string, never>>): Promise<PlatformUsersResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    if (!isSuperAdminRequest(request)) {
      throw new HttpsError("permission-denied", "Super admin required.");
    }

    const [membershipsSnap, organizationsSnap, profilesSnap] = await Promise.all([
      db.collection("organizationMemberships").where("active", "==", true).get(),
      db.collection("organizations").get(),
      db.collection("profiles").get(),
    ]);

    const orgById = new Map<
      string,
      {
        name: string;
        createdBy: string | null;
      }
    >();
    for (const d of organizationsSnap.docs) {
      const data = d.data();
      const organizationId = String(data.organizationId ?? d.id);
      if (INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;
      orgById.set(organizationId, {
        name: String(data.name ?? organizationId),
        createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
      });
    }

    const profileByUid = new Map<string, { email: string | null; displayName: string | null }>();
    for (const d of profilesSnap.docs) {
      const data = d.data();
      profileByUid.set(d.id, {
        email: typeof data.email === "string" ? data.email : null,
        displayName: typeof data.displayName === "string" ? data.displayName : null,
      });
    }

    const usersMap = new Map<string, PlatformUserRow>();
    for (const d of membershipsSnap.docs) {
      const data = d.data();
      const role = data.role;
      if (!isAppRole(role)) continue;
      const uid = String(data.uid ?? "");
      const organizationId = String(data.organizationId ?? "");
      if (!uid || !organizationId || INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;

      const org = orgById.get(organizationId);
      const isOwner = org?.createdBy === uid;
      const existing = usersMap.get(uid);
      const base: PlatformUserRow =
        existing ??
        {
          uid,
          email: profileByUid.get(uid)?.email ?? null,
          displayName: profileByUid.get(uid)?.displayName ?? null,
          isDisabled: false,
          organizationCount: 0,
          organizations: [],
        };

      base.organizations.push({
        organizationId,
        organizationName: org?.name ?? organizationId,
        role,
        isOrganizationOwner: isOwner,
        assignmentType: isOwner ? "owner" : "assigned",
        invitedByUid: typeof data.invitedBy === "string" ? data.invitedBy : null,
      });
      base.organizationCount = base.organizations.length;
      usersMap.set(uid, base);
    }

    const userIds = [...usersMap.keys()];
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100);
      const userRecords = await auth.getUsers(chunk.map((uid) => ({ uid })));
      for (const record of userRecords.users) {
        const row = usersMap.get(record.uid);
        if (!row) continue;
        row.isDisabled = record.disabled === true;
      }
    }

    const users = [...usersMap.values()]
      .map((u) => ({
        ...u,
        organizations: u.organizations.sort((a, b) => a.organizationName.localeCompare(b.organizationName)),
      }))
      .sort((a, b) => (a.email ?? a.uid).localeCompare(b.email ?? b.uid));

    return { users };
  },
);

type SetPlatformUserDisabledPayload = {
  uid: string;
  disabled: boolean;
};

async function assertCanMutatePlatformUser(targetUid: string, actorUid: string): Promise<void> {
  if (targetUid === actorUid) {
    throw new HttpsError("failed-precondition", "You cannot modify your own super-admin account.");
  }
  const userRecord = await auth.getUser(targetUid);
  const email = String(userRecord.email ?? "")
    .trim()
    .toLowerCase();
  if (SUPER_ADMIN_EMAILS.has(email)) {
    throw new HttpsError("failed-precondition", "You cannot modify another super-admin account.");
  }

  const adminMemberships = await db
    .collection("organizationMemberships")
    .where("uid", "==", targetUid)
    .where("active", "==", true)
    .where("role", "==", "admin")
    .get();

  for (const adminMembership of adminMemberships.docs) {
    const organizationId = String(adminMembership.data().organizationId ?? "");
    if (!organizationId || INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;
    const peerAdmins = await db
      .collection("organizationMemberships")
      .where("organizationId", "==", organizationId)
      .where("active", "==", true)
      .where("role", "==", "admin")
      .limit(2)
      .get();

    if (peerAdmins.size <= 1) {
      throw new HttpsError(
        "failed-precondition",
        `Cannot modify this user because they are the only active admin for organization ${organizationId}.`,
      );
    }
  }
}

export const setPlatformUserDisabled = onCall(
  async (request: CallableRequest<SetPlatformUserDisabledPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    if (!isSuperAdminRequest(request)) throw new HttpsError("permission-denied", "Super admin required.");

    const targetUid = String(request.data.uid ?? "").trim();
    const disabled = request.data.disabled === true;
    if (!targetUid) throw new HttpsError("invalid-argument", "uid is required.");

    await assertCanMutatePlatformUser(targetUid, request.auth.uid);
    await auth.updateUser(targetUid, { disabled });

    return { ok: true };
  },
);

type DeletePlatformUserPayload = {
  uid: string;
};

export const deletePlatformUser = onCall(
  async (request: CallableRequest<DeletePlatformUserPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    if (!isSuperAdminRequest(request)) throw new HttpsError("permission-denied", "Super admin required.");

    const targetUid = String(request.data.uid ?? "").trim();
    if (!targetUid) throw new HttpsError("invalid-argument", "uid is required.");

    await assertCanMutatePlatformUser(targetUid, request.auth.uid);

    await deleteCollectionByQuery(db.collection("organizationMemberships").where("uid", "==", targetUid));
    await db.collection("profiles").doc(targetUid).delete();
    await auth.deleteUser(targetUid);

    return { ok: true };
  },
);

type CreatePlatformOrganizationPayload = {
  organizationName: string;
  switchToNewOrg?: boolean;
};

type CreatePlatformOrganizationResponse = {
  ok: true;
  organizationId: string;
};

export const createPlatformOrganization = onCall(
  async (request: CallableRequest<CreatePlatformOrganizationPayload>): Promise<CreatePlatformOrganizationResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    if (!isSuperAdminRequest(request)) {
      throw new HttpsError("permission-denied", "Super admin required.");
    }

    const uid = request.auth.uid;
    const organizationName = String(request.data.organizationName ?? "").trim();
    const switchToNewOrg = request.data.switchToNewOrg !== false;
    if (organizationName.length < 2) {
      throw new HttpsError("invalid-argument", "Organization name must be at least 2 characters.");
    }
    if (organizationName.length > 120) {
      throw new HttpsError("invalid-argument", "Organization name is too long.");
    }

    const slug = slugifyOrganizationName(organizationName);
    const slugDocRef = db.collection("organizationSlugs").doc(slug);
    const orgRef = db.collection("organizations").doc();
    const membershipRef = db.collection("organizationMemberships").doc(`${orgRef.id}_${uid}`);

    await db.runTransaction(async (tx) => {
      const slugSnap = await tx.get(slugDocRef);
      if (slugSnap.exists) {
        throw new HttpsError("already-exists", "Organization name is already in use.");
      }
      tx.create(slugDocRef, {
        slug,
        organizationId: orgRef.id,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      tx.create(orgRef, {
        organizationId: orgRef.id,
        name: organizationName,
        status: "active",
        settings: {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      tx.set(
        membershipRef,
        {
          organizationId: orgRef.id,
          uid,
          role: "admin",
          active: true,
          programIds: [],
          invitedBy: null,
          joinedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    if (switchToNewOrg) {
      await auth.setCustomUserClaims(uid, { orgId: orgRef.id, role: "admin" });
    }

    return { ok: true, organizationId: orgRef.id };
  },
);

type UpdatePlatformOrganizationStatusPayload = {
  organizationId: string;
  status: "active" | "inactive";
};

export const updatePlatformOrganizationStatus = onCall(
  async (request: CallableRequest<UpdatePlatformOrganizationStatusPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    if (!isSuperAdminRequest(request)) throw new HttpsError("permission-denied", "Super admin required.");

    const organizationId = String(request.data.organizationId ?? "").trim();
    const status = request.data.status;
    if (!organizationId) throw new HttpsError("invalid-argument", "organizationId is required.");
    if (status !== "active" && status !== "inactive") throw new HttpsError("invalid-argument", "Invalid status.");
    if (INTERNAL_ORGANIZATION_IDS.has(organizationId)) {
      throw new HttpsError("failed-precondition", "Cannot modify internal platform organization.");
    }

    await db.collection("organizations").doc(organizationId).set(
      {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  },
);

type DeletePlatformOrganizationPayload = {
  organizationId: string;
};

async function deleteCollectionByQuery(q: FirebaseFirestore.Query): Promise<void> {
  while (true) {
    const snap = await q.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    if (snap.size < 400) break;
  }
}

export const deletePlatformOrganization = onCall(
  async (request: CallableRequest<DeletePlatformOrganizationPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    if (!isSuperAdminRequest(request)) throw new HttpsError("permission-denied", "Super admin required.");

    const organizationId = String(request.data.organizationId ?? "").trim();
    if (!organizationId) throw new HttpsError("invalid-argument", "organizationId is required.");
    if (INTERNAL_ORGANIZATION_IDS.has(organizationId)) {
      throw new HttpsError("failed-precondition", "Cannot delete internal platform organization.");
    }

    await deleteCollectionByQuery(db.collection("organizationMemberships").where("organizationId", "==", organizationId));
    await deleteCollectionByQuery(db.collection("organizationSlugs").where("organizationId", "==", organizationId));
    await db.collection("organizations").doc(organizationId).delete();

    return { ok: true };
  },
);

type CreateReferralHandoffPayload = {
  targetOrganizationId: string;
  familyId?: string | null;
  participantProfileId?: string | null;
  summary: string;
};

type UpdateReferralHandoffStatusPayload = {
  handoffId: string;
  status: "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected";
};

type SetSharingConsentPayload = {
  handoffId: string;
  participantProfileId?: string | null;
  allowedFields: string[];
  expiresAtIso?: string | null;
};

type ReferralHandoffRow = {
  handoffId: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  familyId: string | null;
  participantProfileId: string | null;
  summary: string;
  requestedByUid: string;
  status: "draft" | "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected";
  acceptedByUid: string | null;
  updatedAtIso: string | null;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof (value as FirebaseFirestore.Timestamp).toDate === "function") {
    return (value as FirebaseFirestore.Timestamp).toDate().toISOString();
  }
  return null;
}

function assertTokenOrg(request: CallableRequest<unknown>): string {
  const tokenOrgId = String(request.auth?.token.orgId ?? "").trim();
  if (!tokenOrgId) throw new HttpsError("failed-precondition", "Active organization context is required.");
  if (INTERNAL_ORGANIZATION_IDS.has(tokenOrgId)) {
    throw new HttpsError("failed-precondition", "Platform internal context cannot perform tenant collaboration.");
  }
  return tokenOrgId;
}

async function hasActiveMembership(uid: string, organizationId: string): Promise<boolean> {
  const membership = await getMembershipForOrg(uid, organizationId);
  return Boolean(membership?.active);
}

export const createReferralHandoff = onCall(
  async (request: CallableRequest<CreateReferralHandoffPayload>): Promise<{ ok: true; handoffId: string }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const sourceOrganizationId = assertTokenOrg(request);
    const targetOrganizationId = String(request.data.targetOrganizationId ?? "").trim();
    const summary = String(request.data.summary ?? "").trim();
    if (!targetOrganizationId) throw new HttpsError("invalid-argument", "targetOrganizationId is required.");
    if (targetOrganizationId === sourceOrganizationId) {
      throw new HttpsError("invalid-argument", "Target organization must be different from source organization.");
    }
    if (!summary) throw new HttpsError("invalid-argument", "summary is required.");
    if (!(await hasActiveMembership(request.auth.uid, sourceOrganizationId))) {
      throw new HttpsError("permission-denied", "No active source organization membership.");
    }

    const targetOrg = await db.collection("organizations").doc(targetOrganizationId).get();
    if (!targetOrg.exists) throw new HttpsError("not-found", "Target organization not found.");

    const created = await db.collection("referralHandoffs").add({
      sourceOrganizationId,
      targetOrganizationId,
      familyId: request.data.familyId ?? null,
      participantProfileId: request.data.participantProfileId ?? null,
      summary,
      requestedByUid: request.auth.uid,
      status: "pending_acceptance",
      acceptedByUid: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await Promise.all([
      logAuditEvent({
        organizationId: sourceOrganizationId,
        actorUid: request.auth.uid,
        actorEmail: String(request.auth.token.email ?? "") || null,
        action: "handoff_created",
        entityType: "handoff",
        entityId: created.id,
        metadata: { targetOrganizationId },
      }),
      recordUsageMetric({
        organizationId: sourceOrganizationId,
        metricKey: "handoff_sent",
        recordedByUid: request.auth.uid,
        metadata: { handoffId: created.id, targetOrganizationId },
      }),
    ]);

    return { ok: true, handoffId: created.id };
  },
);

export const listMyReferralHandoffs = onCall(
  async (request: CallableRequest<Record<string, never>>): Promise<{ handoffs: ReferralHandoffRow[] }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    if (!(await hasActiveMembership(request.auth.uid, organizationId))) {
      throw new HttpsError("permission-denied", "No active organization membership.");
    }

    const [outboundSnap, inboundSnap] = await Promise.all([
      db.collection("referralHandoffs").where("sourceOrganizationId", "==", organizationId).get(),
      db.collection("referralHandoffs").where("targetOrganizationId", "==", organizationId).get(),
    ]);
    const map = new Map<string, ReferralHandoffRow>();
    for (const d of [...outboundSnap.docs, ...inboundSnap.docs]) {
      const data = d.data();
      map.set(d.id, {
        handoffId: d.id,
        sourceOrganizationId: String(data.sourceOrganizationId ?? ""),
        targetOrganizationId: String(data.targetOrganizationId ?? ""),
        familyId: typeof data.familyId === "string" ? data.familyId : null,
        participantProfileId: typeof data.participantProfileId === "string" ? data.participantProfileId : null,
        summary: String(data.summary ?? ""),
        requestedByUid: String(data.requestedByUid ?? ""),
        status: (data.status as ReferralHandoffRow["status"]) ?? "draft",
        acceptedByUid: typeof data.acceptedByUid === "string" ? data.acceptedByUid : null,
        updatedAtIso: toIso(data.updatedAt),
      });
    }
    const handoffs = [...map.values()].sort((a, b) => (b.updatedAtIso ?? "").localeCompare(a.updatedAtIso ?? ""));
    return { handoffs };
  },
);

export const updateReferralHandoffStatus = onCall(
  async (request: CallableRequest<UpdateReferralHandoffStatusPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    const handoffId = String(request.data.handoffId ?? "").trim();
    const nextStatus = request.data.status;
    if (!handoffId) throw new HttpsError("invalid-argument", "handoffId is required.");
    if (!nextStatus) throw new HttpsError("invalid-argument", "status is required.");

    const handoffRef = db.collection("referralHandoffs").doc(handoffId);
    const handoffSnap = await handoffRef.get();
    if (!handoffSnap.exists) throw new HttpsError("not-found", "Handoff not found.");
    const data = handoffSnap.data();
    if (!data) throw new HttpsError("not-found", "Handoff not found.");
    const sourceOrganizationId = String(data.sourceOrganizationId ?? "");
    const targetOrganizationId = String(data.targetOrganizationId ?? "");
    const isSource = sourceOrganizationId === organizationId;
    const isTarget = targetOrganizationId === organizationId;
    if (!isSource && !isTarget) throw new HttpsError("permission-denied", "No access to this handoff.");

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (nextStatus === "accepted") {
      if (!isTarget) throw new HttpsError("permission-denied", "Only target organization can accept.");
      updatePayload.acceptedByUid = request.auth.uid;
    }
    if (nextStatus === "closed") {
      if (!isSource && !isTarget) throw new HttpsError("permission-denied", "No access to close.");
      updatePayload.closedAt = FieldValue.serverTimestamp();
    }

    await handoffRef.set(updatePayload, { merge: true });
    await logAuditEvent({
      organizationId,
      actorUid: request.auth.uid,
      actorEmail: String(request.auth.token.email ?? "") || null,
      action: "handoff_status_changed",
      entityType: "handoff",
      entityId: handoffId,
      metadata: { status: nextStatus, sourceOrganizationId, targetOrganizationId },
    });
    if (nextStatus === "accepted") {
      await recordUsageMetric({
        organizationId,
        metricKey: "handoff_accepted",
        recordedByUid: request.auth.uid,
        metadata: { handoffId },
      });
    }
    return { ok: true };
  },
);

export const setSharingConsent = onCall(
  async (request: CallableRequest<SetSharingConsentPayload>): Promise<{ ok: true; consentId: string }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    const handoffId = String(request.data.handoffId ?? "").trim();
    const allowedFields = Array.isArray(request.data.allowedFields) ? request.data.allowedFields : [];
    if (!handoffId) throw new HttpsError("invalid-argument", "handoffId is required.");
    if (allowedFields.length === 0) throw new HttpsError("invalid-argument", "allowedFields is required.");

    const handoffSnap = await db.collection("referralHandoffs").doc(handoffId).get();
    if (!handoffSnap.exists) throw new HttpsError("not-found", "Handoff not found.");
    const handoff = handoffSnap.data();
    if (!handoff) throw new HttpsError("not-found", "Handoff not found.");
    if (String(handoff.sourceOrganizationId ?? "") !== organizationId) {
      throw new HttpsError("permission-denied", "Only source organization can grant sharing consent.");
    }
    const requesterRole = String(request.auth.token.role ?? "");
    if (requesterRole !== "admin") {
      throw new HttpsError("permission-denied", "Only organization admins can grant sharing consent.");
    }

    const expiresAtIso = String(request.data.expiresAtIso ?? "").trim();
    const expiresAt = expiresAtIso ? new Date(expiresAtIso) : null;
    const created = await db.collection("sharingConsents").add({
      organizationId,
      handoffId,
      participantProfileId: request.data.participantProfileId ?? null,
      allowedFields,
      grantedByUid: request.auth.uid,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logAuditEvent({
      organizationId,
      actorUid: request.auth.uid,
      actorEmail: String(request.auth.token.email ?? "") || null,
      action: "consent_granted",
      entityType: "consent",
      entityId: created.id,
      metadata: { handoffId, allowedFieldCount: allowedFields.length },
    });
    return { ok: true, consentId: created.id };
  },
);

type CaptureDocumentSignaturePayload = {
  organizationId: string;
  familyDocumentId: string;
  signerName: string;
  signerRole: "client" | "guardian" | "staff" | "witness";
  signingSessionId: string;
  lockDocumentRevision: string;
};

export const captureDocumentSignature = onCall(
  async (request: CallableRequest<CaptureDocumentSignaturePayload>): Promise<{ ok: true; signatureId: string }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    if (organizationId !== String(request.data.organizationId ?? "").trim()) {
      throw new HttpsError("permission-denied", "Token organization mismatch.");
    }
    const familyDocumentId = String(request.data.familyDocumentId ?? "").trim();
    const signerName = String(request.data.signerName ?? "").trim();
    const signerRole = request.data.signerRole;
    const signingSessionId = String(request.data.signingSessionId ?? "").trim();
    const lockDocumentRevision = String(request.data.lockDocumentRevision ?? "").trim();
    if (!familyDocumentId || !signerName || !signerRole || !signingSessionId || !lockDocumentRevision) {
      throw new HttpsError("invalid-argument", "Missing required signature fields.");
    }

    const created = await db.collection("documentSignatures").add({
      organizationId,
      familyDocumentId,
      signerUid: request.auth.uid,
      signerName,
      signerRole,
      signedAt: FieldValue.serverTimestamp(),
      signingSessionId,
      lockDocumentRevision,
      ipAddressHash: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await Promise.all([
      logAuditEvent({
        organizationId,
        actorUid: request.auth.uid,
        actorEmail: String(request.auth.token.email ?? "") || null,
        action: "signature_captured",
        entityType: "document",
        entityId: created.id,
        metadata: { familyDocumentId, signerRole },
      }),
      recordUsageMetric({
        organizationId,
        metricKey: "signature_completed",
        recordedByUid: request.auth.uid,
        metadata: { signatureId: created.id },
      }),
    ]);
    return { ok: true, signatureId: created.id };
  },
);

type CreateAuditableExportPayload = {
  exportType: "case_summary" | "handoff_packet" | "billing_packet";
  reason: string;
  filters?: Record<string, unknown>;
};

export const createAuditableExport = onCall(
  async (request: CallableRequest<CreateAuditableExportPayload>): Promise<{ ok: true; exportId: string }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    const role = String(request.auth.token.role ?? "");
    if (role !== "admin") throw new HttpsError("permission-denied", "Admin role required for exports.");

    const exportType = request.data.exportType;
    const reason = String(request.data.reason ?? "").trim();
    if (!exportType || !reason) throw new HttpsError("invalid-argument", "exportType and reason are required.");

    const created = await db.collection("adminReportExports").add({
      organizationId,
      exportType,
      reason,
      status: "queued",
      requestedBy: request.auth.uid,
      requestedAt: FieldValue.serverTimestamp(),
      filters: request.data.filters ?? {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await Promise.all([
      logAuditEvent({
        organizationId,
        actorUid: request.auth.uid,
        actorEmail: String(request.auth.token.email ?? "") || null,
        action: "export_generated",
        entityType: "export",
        entityId: created.id,
        metadata: { exportType, reason },
      }),
      recordUsageMetric({
        organizationId,
        metricKey: "export_generated",
        recordedByUid: request.auth.uid,
        metadata: { exportId: created.id, exportType },
      }),
    ]);
    return { ok: true, exportId: created.id };
  },
);

type SetOrganizationDataRetentionPayload = {
  organizationId?: string;
  retentionDays: number;
};

export const setOrganizationDataRetention = onCall(
  async (request: CallableRequest<SetOrganizationDataRetentionPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const tokenOrgId = assertTokenOrg(request);
    const requestedOrgId = String(request.data.organizationId ?? "").trim();
    const organizationId = requestedOrgId || tokenOrgId;
    const retentionDays = Number(request.data.retentionDays ?? 0);
    if (!Number.isFinite(retentionDays) || retentionDays < 30 || retentionDays > 3650) {
      throw new HttpsError("invalid-argument", "retentionDays must be between 30 and 3650.");
    }
    const isSuperAdmin = isSuperAdminRequest(request);
    const role = String(request.auth.token.role ?? "");
    if (!isSuperAdmin && (role !== "admin" || organizationId !== tokenOrgId)) {
      throw new HttpsError("permission-denied", "Only org admin (own org) or super admin can set retention.");
    }

    await db.collection("organizations").doc(organizationId).set(
      {
        "settings.dataRetentionDays": retentionDays,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  },
);

type SetOrganizationEntitlementPayload = {
  organizationId: string;
  plan: "starter" | "growth" | "professional" | "enterprise";
  enabledFeatures: string[];
  limits?: {
    staffSeats?: number | null;
    activeCases?: number | null;
    monthlyHandoffs?: number | null;
  };
  billingStatus?: "trial" | "active" | "past_due" | "canceled";
};

export const setOrganizationEntitlement = onCall(
  async (request: CallableRequest<SetOrganizationEntitlementPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    if (!isSuperAdminRequest(request)) throw new HttpsError("permission-denied", "Super admin required.");
    const organizationId = String(request.data.organizationId ?? "").trim();
    if (!organizationId) throw new HttpsError("invalid-argument", "organizationId is required.");
    await db.collection("entitlements").doc(organizationId).set(
      {
        organizationId,
        plan: request.data.plan,
        enabledFeatures: request.data.enabledFeatures ?? [],
        limits: {
          staffSeats: request.data.limits?.staffSeats ?? null,
          activeCases: request.data.limits?.activeCases ?? null,
          monthlyHandoffs: request.data.limits?.monthlyHandoffs ?? null,
        },
        billingStatus: request.data.billingStatus ?? "active",
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: request.auth.uid,
      },
      { merge: true },
    );
    await logAuditEvent({
      organizationId,
      actorUid: request.auth.uid,
      actorEmail: String(request.auth.token.email ?? "") || null,
      action: "entitlement_changed",
      entityType: "entitlement",
      entityId: organizationId,
      metadata: { plan: request.data.plan },
    });
    return { ok: true };
  },
);

export const getMyOrganizationEntitlement = onCall(
  async (request: CallableRequest<Record<string, never>>): Promise<{
    organizationId: string;
    plan: "starter" | "growth" | "professional" | "enterprise";
    enabledFeatures: string[];
    limits: { staffSeats: number | null; activeCases: number | null; monthlyHandoffs: number | null };
    billingStatus: "trial" | "active" | "past_due" | "canceled";
  }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    const entitlementSnap = await db.collection("entitlements").doc(organizationId).get();
    if (!entitlementSnap.exists) {
      return {
        organizationId,
        plan: DEFAULT_ENTITLEMENT.plan,
        enabledFeatures: [...DEFAULT_ENTITLEMENT.enabledFeatures],
        limits: { ...DEFAULT_ENTITLEMENT.limits },
        billingStatus: DEFAULT_ENTITLEMENT.billingStatus,
      };
    }
    const data = entitlementSnap.data() ?? {};
    return {
      organizationId,
      plan: (data.plan as "starter" | "growth" | "professional" | "enterprise") ?? DEFAULT_ENTITLEMENT.plan,
      enabledFeatures: Array.isArray(data.enabledFeatures) ? data.enabledFeatures : [...DEFAULT_ENTITLEMENT.enabledFeatures],
      limits: {
        staffSeats: typeof data.limits?.staffSeats === "number" ? data.limits.staffSeats : null,
        activeCases: typeof data.limits?.activeCases === "number" ? data.limits.activeCases : null,
        monthlyHandoffs: typeof data.limits?.monthlyHandoffs === "number" ? data.limits.monthlyHandoffs : null,
      },
      billingStatus: (data.billingStatus as "trial" | "active" | "past_due" | "canceled") ?? "active",
    };
  },
);

type TrackUsageMetricPayload = {
  metricKey:
    | "inquiry_created"
    | "inquiry_converted"
    | "handoff_sent"
    | "handoff_accepted"
    | "signature_completed"
    | "export_generated";
  amount?: number;
  metadata?: Record<string, unknown>;
};

export const trackUsageMetric = onCall(
  async (request: CallableRequest<TrackUsageMetricPayload>): Promise<{ ok: true }> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
    const organizationId = assertTokenOrg(request);
    await recordUsageMetric({
      organizationId,
      metricKey: request.data.metricKey,
      amount: request.data.amount,
      recordedByUid: request.auth.uid,
      metadata: request.data.metadata,
    });
    return { ok: true };
  },
);

export const enforceDataRetention = onSchedule("0 3 * * *", async () => {
  const organizationsSnap = await db.collection("organizations").get();
  let deletedAuditEvents = 0;
  for (const orgDoc of organizationsSnap.docs) {
    const orgData = orgDoc.data();
    const organizationId = String(orgData.organizationId ?? orgDoc.id);
    if (!organizationId || INTERNAL_ORGANIZATION_IDS.has(organizationId)) continue;
    const retentionDaysRaw = Number(orgData.settings?.dataRetentionDays ?? 365);
    const retentionDays = Number.isFinite(retentionDaysRaw) ? Math.max(30, Math.min(3650, retentionDaysRaw)) : 365;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    while (true) {
      const staleAuditSnap = await db
        .collection("auditEvents")
        .where("organizationId", "==", organizationId)
        .where("createdAt", "<=", cutoff)
        .limit(300)
        .get();
      if (staleAuditSnap.empty) break;
      const batch = db.batch();
      for (const staleDoc of staleAuditSnap.docs) {
        batch.delete(staleDoc.ref);
      }
      await batch.commit();
      deletedAuditEvents += staleAuditSnap.size;
      if (staleAuditSnap.size < 300) break;
    }
  }

  await db.collection("systemJobs").add({
    type: "enforceDataRetention",
    status: "completed",
    deletedAuditEvents,
    executedAt: FieldValue.serverTimestamp(),
  });
});

/** Every 15 min: missing document reminders (first + repeat every 7 days), notify staff; create staff action prompts if reminder unresolved after threshold. */
export const reminderDispatcher = onSchedule("every 15 minutes", async () => {
  const [missingResult, escalationResult] = await Promise.all([
    runMissingDocumentReminders(),
    runReminderToPromptEscalation(),
  ]);
  await db.collection("systemJobs").add({
    type: "reminderDispatcher",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    remindersCreated: missingResult.remindersCreated,
    promptsCreated: escalationResult.promptsCreated,
  });
});

/** Every 60 min: detect stale cases (no interaction in X days), create overdue follow-up prompts. */
export const escalationWorkflow = onSchedule("every 60 minutes", async () => {
  const result = await runStaleCaseDetection();
  await db.collection("systemJobs").add({
    type: "escalationWorkflow",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    promptsCreated: result.promptsCreated,
  });
});

/** Daily 8:00 AM: organization summary for admins. */
export const dailyOrgSummary = onSchedule("0 8 * * *", async () => {
  const result = await runDailyOrgSummary();
  await db.collection("systemJobs").add({
    type: "dailyOrgSummary",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    orgsProcessed: result.orgsProcessed,
  });
});

/** Monday 9:00 AM: remind staff to submit weekly agenda. */
export const weeklyAgendaReminder = onSchedule("0 9 * * 1", async () => {
  const result = await runWeeklyAgendaReminder();
  await db.collection("systemJobs").add({
    type: "weeklyAgendaReminder",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    promptsCreated: result.promptsCreated,
  });
});

/** Tuesday 9:00 AM: notify admin when agenda is overdue. */
export const weeklyAgendaOverdueNotifyAdmin = onSchedule("0 9 * * 2", async () => {
  await runWeeklyAgendaOverdueNotifyAdmin();
  await db.collection("systemJobs").add({
    type: "weeklyAgendaOverdueNotifyAdmin",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
  });
});

/** Friday 4:00 PM: remind staff to submit weekly report. */
export const weeklyReportReminder = onSchedule("0 16 * * 5", async () => {
  const result = await runWeeklyReportReminder();
  await db.collection("systemJobs").add({
    type: "weeklyReportReminder",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    promptsCreated: result.promptsCreated,
  });
});

/** Saturday 10:00 AM: notify admin when weekly report is overdue. */
export const weeklyReportOverdueNotifyAdmin = onSchedule("0 10 * * 6", async () => {
  await runWeeklyReportOverdueNotifyAdmin();
  await db.collection("systemJobs").add({
    type: "weeklyReportOverdueNotifyAdmin",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
  });
});

/** Daily 1:00 AM: generate reporting snapshots for dashboard. */
export const reportingSnapshots = onSchedule("0 1 * * *", async () => {
  const result = await runReportingSnapshots();
  await db.collection("systemJobs").add({
    type: "reportingSnapshots",
    executedAt: FieldValue.serverTimestamp(),
    status: "completed",
    snapshotsCreated: result.snapshotsCreated,
  });
});

/** Legacy: weekly agenda compiler (placeholder). */
export const weeklyAgendaCompiler = onSchedule("every monday 07:00", async () => {
  await db.collection("systemJobs").add({
    type: "weeklyAgendaCompiler",
    executedAt: FieldValue.serverTimestamp(),
    status: "queued",
  });
});

/** Legacy: weekly report rollup (placeholder). */
export const weeklyReportRollup = onSchedule("every friday 18:00", async () => {
  await db.collection("systemJobs").add({
    type: "weeklyReportRollup",
    executedAt: FieldValue.serverTimestamp(),
    status: "queued",
  });
});

export const reportExportGenerator = onCall(async (request: CallableRequest<unknown>) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  if (request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required.");
  }

  return {
    ok: true,
    message: "Report export job accepted.",
  };
});
