/**
 * Firestore collection names. All tenant-scoped collections use organizationId.
 * Phase 3 canonical names: profiles, organizationMemberships.
 */
export const COLLECTIONS = {
  // Core
  organizations: "organizations",
  organizationMemberships: "organizationMemberships",
  profiles: "profiles",
  roles: "roles",
  // Families
  families: "families",
  familyMembers: "familyMembers",
  participantProfiles: "participantProfiles",
  // Case management
  intakes: "intakes",
  enrollments: "enrollments",
  assessments: "assessments",
  staffAssignments: "staffAssignments",
  interactions: "interactions",
  notes: "notes",
  // Goals: subcollection families/{id}/goals
  goals: "goals",
  // Goal tasks: subcollection families/{id}/goals/{id}/goalTasks
  goalTasks: "goalTasks",
  // Resources
  resources: "resources",
  resourceCategories: "resourceCategories",
  familyResourceAssignments: "familyResourceAssignments",
  referrals: "referrals",
  // Documents
  requiredDocumentTemplates: "requiredDocumentTemplates",
  familyDocuments: "familyDocuments",
  familyDocumentRequirements: "familyDocumentRequirements",
  uploadRequests: "uploadRequests",
  // Notifications
  reminders: "reminders",
  staffActionPrompts: "staffActionPrompts",
  escalationEvents: "escalationEvents",
  // Surveys and outcomes
  surveys: "surveys",
  surveyQuestions: "surveyQuestions",
  surveyResponses: "surveyResponses",
  outcomeMetrics: "outcomeMetrics",
  outcomeSnapshots: "outcomeSnapshots",
  // Admin command center
  schools: "schools",
  partnerOrganizations: "partnerOrganizations",
  familySchoolLinks: "familySchoolLinks",
  familyPartnerLinks: "familyPartnerLinks",
  staffWeeklyAgendas: "staffWeeklyAgendas",
  staffWeeklyReports: "staffWeeklyReports",
  staffReportItems: "staffReportItems",
  staffScheduleEntries: "staffScheduleEntries",
  staffTimesheetSummaries: "staffTimesheetSummaries",
  adminReportExports: "adminReportExports",
  organizationMetricsSnapshots: "organizationMetricsSnapshots",
  auditLogs: "auditLogs",
} as const;

/** Legacy names for Phase 2 compatibility; map to same collections as above. */
export const LEGACY_COLLECTIONS = {
  users: COLLECTIONS.profiles,
  orgUsers: COLLECTIONS.organizationMemberships,
} as const;
