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
      if (!organizationId) continue;
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

    const users = [...usersMap.values()]
      .map((u) => ({
        ...u,
        organizations: u.organizations.sort((a, b) => a.organizationName.localeCompare(b.organizationName)),
      }))
      .sort((a, b) => (a.email ?? a.uid).localeCompare(b.email ?? b.uid));

    return { users };
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
