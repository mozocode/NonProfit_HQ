/**
 * Demo schedule entries for development / training (Phase 20).
 * Safe to run multiple times — creates additional rows each time.
 */

import { addDaysYmd, toYmd } from "@/lib/scheduleDateUtils";
import type { CreateScheduleEntryInput } from "@/types/schedule";
import { createScheduleEntry } from "@/services/firestore/scheduleService";

function buildDemoTemplates(todayYmd: string): CreateScheduleEntryInput[] {
  const t1 = addDaysYmd(todayYmd, 0);
  const t2 = addDaysYmd(todayYmd, 1);
  const t3 = addDaysYmd(todayYmd, 2);
  return [
    {
      date: t1,
      startTime: "09:00",
      endTime: "09:45",
      title: "Team huddle",
      location: "Conference room A",
      type: "meeting",
      familyId: null,
      caseId: null,
      linkedStaffUid: null,
      notes: "Seeded demo — replace with real calendar blocks.",
    },
    {
      date: t1,
      startTime: "13:00",
      endTime: "15:00",
      title: "Home visit follow-up",
      location: "Eastside community center",
      type: "work",
      familyId: null,
      caseId: "DEMO-CASE-01",
      linkedStaffUid: null,
      notes: null,
    },
    {
      date: t2,
      startTime: "10:30",
      endTime: "11:30",
      title: "Resource referral call",
      location: "Virtual",
      type: "work",
      familyId: null,
      caseId: null,
      linkedStaffUid: null,
      notes: null,
    },
    {
      date: t3,
      startTime: "08:00",
      endTime: "12:00",
      title: "Training / PTO",
      location: "—",
      type: "leave",
      familyId: null,
      caseId: null,
      linkedStaffUid: null,
      notes: "Demo leave block",
    },
  ];
}

/**
 * Writes several entries for the next few days for one or two staff UIDs.
 * @returns number of documents created
 */
export async function seedDemoScheduleData(organizationId: string, staffUids: string[]): Promise<number> {
  if (staffUids.length === 0) return 0;
  const primary = staffUids[0];
  const secondary = staffUids[1] ?? primary;
  const todayYmd = toYmd(new Date());
  const templates = buildDemoTemplates(todayYmd);
  let n = 0;
  for (let i = 0; i < templates.length; i++) {
    const staff = i % 2 === 0 ? primary : secondary;
    const row = { ...templates[i]! };
    if (i === 0 && primary !== secondary) {
      row.linkedStaffUid = secondary;
    }
    await createScheduleEntry(organizationId, staff, row);
    n++;
  }
  return n;
}
