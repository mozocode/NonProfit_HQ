/**
 * Remind staff to submit weekly report. Notify admin when report is overdue.
 */

import { getFirestore } from "firebase-admin/firestore";
import { createStaffPrompt } from "../helpers/reminders";
import { notifyStaff, notifyAdmins } from "../notifications";

const db = getFirestore();

/** Current week start (Sunday) as YYYY-MM-DD */
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function runWeeklyReportReminder(): Promise<{ promptsCreated: number }> {
  const weekStart = currentWeekStart();
  let promptsCreated = 0;

  const membersSnap = await db
    .collection("organizationMemberships")
    .where("role", "in", ["staff", "admin"])
    .where("active", "==", true)
    .get();

  for (const memDoc of membersSnap.docs) {
    const data = memDoc.data();
    const organizationId = data.organizationId as string;
    const staffUid = data.uid as string;

    const existingReport = await db
      .collection("staffWeeklyReports")
      .where("organizationId", "==", organizationId)
      .where("staffUid", "==", staffUid)
      .where("weekStart", "==", weekStart)
      .limit(1)
      .get();
    if (!existingReport.empty) continue;

    const existingPrompt = await db
      .collection("staffActionPrompts")
      .where("organizationId", "==", organizationId)
      .where("staffUid", "==", staffUid)
      .where("type", "==", "missing_weekly_report")
      .where("completedAt", "==", null)
      .get();
    if (!existingPrompt.empty) continue;

    const dueAt = new Date().toISOString();
    await createStaffPrompt({
      organizationId,
      staffUid,
      type: "missing_weekly_report",
      dueAt,
      title: `Submit weekly report (week of ${weekStart})`,
      createdByUid: "system",
    });
    promptsCreated++;

    await notifyStaff({
      staffUid,
      organizationId,
      title: "Weekly report due",
      body: `Please submit your weekly report for the week of ${weekStart}.`,
      type: "reminder",
    });
  }

  return { promptsCreated };
}

/** Notify admins when staff have not submitted report (e.g. run Saturday or Monday). */
export async function runWeeklyReportOverdueNotifyAdmin(): Promise<void> {
  const weekStart = currentWeekStart();

  const orgsSnap = await db.collection("organizations").get();
  for (const orgDoc of orgsSnap.docs) {
    const organizationId = orgDoc.id;

    const staffMembers = await db
      .collection("organizationMemberships")
      .where("organizationId", "==", organizationId)
      .where("role", "in", ["staff", "admin"])
      .where("active", "==", true)
      .get();

    const missing: string[] = [];
    for (const mem of staffMembers.docs) {
      const staffUid = mem.data().uid as string;
      const reportSnap = await db
        .collection("staffWeeklyReports")
        .where("organizationId", "==", organizationId)
        .where("staffUid", "==", staffUid)
        .where("weekStart", "==", weekStart)
        .limit(1)
        .get();
      if (reportSnap.empty) {
        const profileSnap = await db.collection("profiles").doc(staffUid).get();
        const name = profileSnap.exists ? (profileSnap.data()?.displayName as string) ?? staffUid : staffUid;
        missing.push(name);
      }
    }

    if (missing.length === 0) continue;

    const adminMembers = await db
      .collection("organizationMemberships")
      .where("organizationId", "==", organizationId)
      .where("role", "==", "admin")
      .where("active", "==", true)
      .get();
    const adminUids = adminMembers.docs.map((d) => d.data().uid as string);
    if (adminUids.length === 0) continue;

    await notifyAdmins({
      organizationId,
      title: "Weekly reports overdue",
      body: `The following have not submitted report for week of ${weekStart}: ${missing.join(", ")}`,
      adminUids,
      type: "overdue_report",
    });
  }
}
