/**
 * Admin management / tenant tooling (Phase 22).
 */

import type { AppRole } from "@/types/auth";

export interface AdminOrgMemberRow {
  uid: string;
  membershipDocId: string;
  role: AppRole;
  active: boolean;
  programIds: string[];
  displayName: string | null;
  email: string | null;
  joinedAt: string | null;
}

export interface AuditLogListItem {
  logId: string;
  organizationId: string;
  action: string;
  actorUid: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Persisted under organizations.settings.workflowStages (multi-org friendly). */
export interface OrgWorkflowStageSetting {
  id: string;
  label: string;
  order: number;
}
