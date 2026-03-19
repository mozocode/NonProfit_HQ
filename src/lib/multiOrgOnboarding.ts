/**
 * Multi-organization onboarding notes (Phase 22).
 * Runtime remains single-org-per-session via AuthProvider orgId; this module documents expansion.
 */

export const MULTI_ORG_ONBOARDING_STEPS = [
  "Create organizations/{organizationId} with name, status, and initial settings.",
  "Create organizationMemberships for at least one admin (role admin, active true, uid set).",
  "Optionally set organizations.settings.workflowStages for custom case stages.",
  "Seed resourceCategories + resources, requiredDocumentTemplates, schools, partnerOrganizations as needed.",
  "Deploy Firestore rules/indexes; verify admin-only writes on sensitive collections.",
  "Future: org switcher reads multiple memberships and sets session orgId (client + custom claims or membership query).",
] as const;

export function describeTenantIsolation(): string {
  return (
    "All tenant data is scoped by organizationId on documents. Admin tools in this app use the signed-in " +
    "user's current org from AuthProvider. Multi-org users would need an org picker that updates org context " +
    "before mutations."
  );
}
