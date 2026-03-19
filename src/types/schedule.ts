/**
 * Schedule / calendar view models (Phase 20).
 */

import type { StaffScheduleEntry } from "@/types/domain";

export interface ScheduleEntryView extends StaffScheduleEntry {
  familyLabel: string | null;
  linkedStaffLabel: string | null;
  /** Owner display name (resolved for admin / org views) */
  primaryStaffLabel?: string | null;
}

export type ScheduleViewMode = "day" | "week";

export interface CreateScheduleEntryInput {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string | null;
  type: StaffScheduleEntry["type"];
  familyId: string | null;
  caseId: string | null;
  linkedStaffUid: string | null;
  notes: string | null;
}

export interface UpdateScheduleEntryInput extends CreateScheduleEntryInput {
  entryId: string;
}
