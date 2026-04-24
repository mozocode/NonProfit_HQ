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

function slugifyOrganizationName(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "org";
}

async function getExistingMembership(uid: string): Promise<{ organizationId: string; role: "admin" | "staff" | "participant" } | null> {
  const snap = await db
    .collection("organizationMemberships")
    .where("uid", "==", uid)
    .where("active", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  const role = data.role;
  if (role !== "admin" && role !== "staff" && role !== "participant") return null;
  return {
    organizationId: String(data.organizationId),
    role,
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
