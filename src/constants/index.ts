/**
 * Application constants (route paths, role names, feature flags).
 */

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  LOGIN: "/login",
  SIGN_UP: "/sign-up",
  CREATE_ORGANIZATION: "/onboarding/create-organization",
  FORGOT_PASSWORD: "/forgot-password",
  UNAUTHORIZED: "/unauthorized",
  ADMIN: "/admin",
  ADMIN_ORGANIZATION: "/admin/organization",
  STAFF: "/staff",
  STAFF_FAMILY: (id: string) => `/staff/family/${id}`,
  STAFF_FAMILY_GOAL: (familyId: string, goalId: string) => `/staff/family/${familyId}/goals/${goalId}`,
  STAFF_FAMILY_GOAL_NEW: (familyId: string) => `/staff/family/${familyId}/goals/new`,
  STAFF_FAMILY_INTAKE: (id: string) => `/staff/family/${id}/intake`,
  STAFF_FAMILY_ENROLLMENT: (id: string) => `/staff/family/${id}/enrollment`,
  STAFF_FAMILY_ASSESSMENT: (id: string) => `/staff/family/${id}/assessment`,
  STAFF_TASK: (id: string) => `/staff/task/${id}`,
  STAFF_RESOURCES: "/staff/resources",
  STAFF_SCHEDULE: "/staff/schedule",
  STAFF_AGENDA: "/staff/agenda",
  STAFF_REPORT: "/staff/report",
  STAFF_REMINDERS: "/staff/reminders",
  STAFF_SURVEYS: "/staff/surveys",
  STAFF_SURVEY: (id: string) => `/staff/surveys/${id}`,
  PARTICIPANT: "/participant",
  PARTICIPANT_SURVEYS: "/participant/surveys",
  PARTICIPANT_SURVEY: (id: string) => `/participant/surveys/${id}`,
  ADMIN_SURVEYS: "/admin/surveys",
  ADMIN_SURVEY_REPORT: (id: string) => `/admin/surveys/${id}`,
  ADMIN_REPORTING: "/admin/reporting",
  ADMIN_SCHEDULE: "/admin/schedule",
  ADMIN_EXPORTS: "/admin/exports",
  ADMIN_SCHOOLS: "/admin/schools",
  ADMIN_PARTNERS: "/admin/partners",
  ADMIN_WEEKLY_SUBMISSIONS: "/admin/weekly-submissions",
  ADMIN_WEEKLY_OVERSIGHT: "/admin/weekly-oversight",
  ADMIN_WEEKLY_OVERSIGHT_STAFF: (staffUid: string) => `/admin/weekly-oversight/staff/${staffUid}`,
  /** Phase 22 — management hub and tools */
  ADMIN_TOOLS: "/admin/tools",
  ADMIN_TOOLS_STAFF: "/admin/tools/staff",
  ADMIN_TOOLS_RESOURCES: "/admin/tools/resources",
  ADMIN_TOOLS_DOCUMENT_TEMPLATES: "/admin/tools/document-templates",
  ADMIN_TOOLS_WORKFLOWS: "/admin/tools/workflows",
  ADMIN_TOOLS_AUDIT_LOGS: "/admin/tools/audit-logs",
  ADMIN_TOOLS_ORGANIZATION: "/admin/tools/organization",
} as const;

export const ROLES = ["admin", "staff", "participant"] as const;
export type AppRoleConstant = (typeof ROLES)[number];
