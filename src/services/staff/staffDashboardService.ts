import type { StaffDashboardData } from "@/types/staffDashboard";
import { getMockStaffDashboardData } from "./mockStaffDashboard";

/**
 * Staff dashboard service. Uses mock data when Firestore is not wired.
 * Replace getMockStaffDashboardData with Firestore queries when backend is ready.
 */
export const staffDashboardService = {
  /**
   * Fetch all dashboard data for the staff member. Single call for the main dashboard view.
   */
  async getDashboardData(organizationId: string, staffUid: string): Promise<StaffDashboardData> {
    // TODO: Replace with Firestore:
    // - families (where staffAssignments.staffUid === staffUid)
    // - tasks/goalTasks (assigned to staff, due soon)
    // - familyDocumentRequirements (missing)
    // - reminders (assignedToUid, sentAt null)
    // - staffWeeklyAgendas (staffUid, weekStart)
    // - staffScheduleEntries (staffUid, startAt today)
    // - staffActionPrompts (staffUid, completedAt null)
    await delay(400);
    return getMockStaffDashboardData(organizationId, staffUid);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
