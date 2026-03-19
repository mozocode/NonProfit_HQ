/**
 * Remind staff to submit weekly agenda. Notify admin when overdue.
 */

import { getFirestore } from "firebase-admin/firestore";
import { createStaffPrompt } from "../helpers/reminders";
import { notifyStaff, notifyAdmins } from "../notifications";

const db = getFirestore();

/** Next Monday (week start) as YYYY-MM-DD */
function nextWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

export async function runWeeklyAgendaReminder(): Promise<{ promptsCreated: number }> {
  const weekStart = nextWeekStart();
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

    const existingAgenda = await db
      .collection("staffWeeklyAgendas")
      .where("organizationId", "==", organizationId)
      .where("staffUid", "==", staffUid)
      .where("weekStart", "==", weekStart)
      .limit(1)
      .get();
    if (!existingAgenda.empty) continue;

    const existingPrompt = await db
      .collection("staffActionPrompts")
      .where("organizationId", "==", organizationId)
      .where("staffUid", "==", staffUid)
      .where("type", "==", "missing_weekly_agenda")
      .where("completedAt", "==", null)
      .get();
    if (!existingPrompt.empty) continue;

    const dueAt = new Date().toISOString();
    await createStaffPrompt({
      organizationId,
      staffUid,
      type: "missing_weekly_agenda",
      dueAt,
      title: `Submit weekly agenda (week of ${weekStart})`,
      createdByUid: "system",
    });
    promptsCreated++;

    await notifyStaff({
      staffUid,
      organizationId,
      title: "Weekly agenda due",
      body: `Please submit your agenda for the week of ${weekStart}.`,
      type: "reminder",
    });
  }

  return { promptsCreated };
}

/** Notify admins when staff have not submitted agenda (e.g. run Tuesday AM). */
export async function runWeeklyAgendaOverdueNotifyAdmin(): Promise<void> {
  const weekStart = nextWeekStart();

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
      const agendaSnap = await db
        .collection("staffWeeklyAgendas")
        .where("organizationId", "==", organizationId)
        .where("staffUid", "==", staffUid)
        .where("weekStart", "==", weekStart)
        .limit(1)
        .get();
      if (agendaSnap.empty) {
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
      title: "Weekly agendas overdue",
      body: `The following have not submitted agenda for week of ${weekStart}: ${missing.join(", ")}`,
      adminUids,
      type: "overdue_agenda",
    });
  }
}
