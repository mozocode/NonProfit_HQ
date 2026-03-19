import type { FamilyProfileData } from "@/types/familyProfile";
import { getMockFamilyProfileData } from "./mockFamilyProfile";

/**
 * Family profile service. Uses mock data when Firestore is not wired.
 * Replace with Firestore reads for families, familyMembers, goals, tasks, notes, etc.
 */
export const familyProfileService = {
  /**
   * Fetch full family profile data for the given family ID.
   */
  async getFamilyProfile(_organizationId: string, familyId: string): Promise<FamilyProfileData> {
    // TODO: Firestore – families/{id}, familyMembers (where familyId), goals subcollection,
    // goalTasks, notes, familyDocumentRequirements, familyDocuments, familyResourceAssignments + resources, interactions for timeline
    await delay(300);
    return getMockFamilyProfileData(familyId);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
