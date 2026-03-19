/**
 * Daily organization summary for admins: aggregate counts and notify.
 */

import { getFirestore } from "firebase-admin/firestore";
import { notifyAdmins } from "../notifications";

const db = getFirestore();

export async function runDailyOrgSummary(): Promise<{ orgsProcessed: number }> {
  const orgsSnap = await db.collection("organizations").get();
  let orgsProcessed = 0;

  for (const orgDoc of orgsSnap.docs) {
    const organizationId = orgDoc.id;
    const orgData = orgDoc.data();
    const orgName = (orgData.name as string) ?? "Organization";

    // Count missing document requirements
    const missingDocSnap = await db
      .collection("familyDocumentRequirements")
      .where("organizationId", "==", organizationId)
      .where("status", "==", "missing")
      .get();
    const missingDocsCount = missingDocSnap.size;

    // Count unacknowledged reminders
    const unackRemindersSnap = await db
      .collection("reminders")
      .where("organizationId", "==", organizationId)
      .where("acknowledgedAt", "==", null)
      .get();
    const unackRemindersCount = unackRemindersSnap.size;

    // Get admin UIDs for this org
    const membersSnap = await db
      .collection("organizationMemberships")
      .where("organizationId", "==", organizationId)
      .where("role", "==", "admin")
      .where("active", "==", true)
      .get();
    const adminUids = membersSnap.docs.map((d) => d.data().uid as string);
    if (adminUids.length === 0) continue;

    const lines: string[] = [
      `Daily summary for ${orgName}:`,
      `- Missing documents: ${missingDocsCount}`,
      `- Unacknowledged reminders: ${unackRemindersCount}`,
    ];

    await notifyAdmins({
      organizationId,
      title: `Daily summary: ${orgName}`,
      body: lines.join("\n"),
      adminUids,
      type: "summary",
    });
    orgsProcessed++;
  }

  return { orgsProcessed };
}
