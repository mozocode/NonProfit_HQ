"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { AdminOrgMemberRow, AuditLogListItem, OrgWorkflowStageSetting } from "@/types/adminManagement";
import type { Organization } from "@/types/domain";
import type { AppRole } from "@/types/auth";
import { listOrganizationMembers, adminSetMemberRole, adminSetMemberActive } from "@/services/firestore/adminMembershipService";
import { getOrganization, adminUpdateOrganization, getOrgWorkflowStages, saveOrgWorkflowStages } from "@/services/firestore/organizationService";
import { listAuditLogsForOrganization } from "@/services/firestore/auditLogService";
import { getCategories, getResources, adminCreateResourceCategory, adminCreateResource, adminUpdateResource } from "@/services/firestore/resourcesService";
import type { AdminUpsertResourceInput } from "@/services/firestore/resourcesService";
import { getRequiredTemplates, adminCreateRequiredTemplate, adminUpdateRequiredTemplate } from "@/services/firestore/documentsService";
import type { AdminRequiredTemplateInput } from "@/services/firestore/documentsService";
import type { RequiredTemplateView } from "@/types/documents";

export function useAdminOrganizationMembers() {
  const { orgId, user } = useAuth();
  const actorUid = user?.uid ?? null;
  const [members, setMembers] = useState<AdminOrgMemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setMembers([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setMembers(await listOrganizationMembers(orgId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setRole = useCallback(
    async (targetUid: string, role: AppRole) => {
      if (!orgId) throw new Error("No organization");
      await adminSetMemberRole(orgId, targetUid, role);
      await refetch();
    },
    [orgId, refetch],
  );

  const setActive = useCallback(
    async (targetUid: string, active: boolean) => {
      if (!orgId || !actorUid) throw new Error("Not signed in");
      await adminSetMemberActive(orgId, targetUid, active, actorUid);
      await refetch();
    },
    [orgId, actorUid, refetch],
  );

  return { members, isLoading, error, refetch, setRole, setActive };
}

export function useAdminAuditLogs(maxRows = 200) {
  const { orgId } = useAuth();
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setLogs([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setLogs(await listAuditLogsForOrganization(orgId, { maxRows }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, maxRows]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { logs, isLoading, error, refetch };
}

export function useAdminOrganizationRecord() {
  const { orgId } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setOrg(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setOrg(await getOrganization(orgId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(
    async (input: { name?: string; status?: Organization["status"] }) => {
      if (!orgId) throw new Error("No organization");
      await adminUpdateOrganization(orgId, input);
      await refetch();
    },
    [orgId, refetch],
  );

  return { org, isLoading, error, refetch, save };
}

export function useAdminResourceDirectoryManage() {
  const { orgId } = useAuth();
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [resources, setResources] = useState<Awaited<ReturnType<typeof getResources>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setCategories([]);
      setResources([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([getCategories(orgId), getResources(orgId)]);
      setCategories(c);
      setResources(r);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!orgId) throw new Error("No organization");
      await adminCreateResourceCategory(orgId, { name });
      await refetch();
    },
    [orgId, refetch],
  );

  const addResource = useCallback(
    async (input: AdminUpsertResourceInput) => {
      if (!orgId) throw new Error("No organization");
      await adminCreateResource(orgId, input);
      await refetch();
    },
    [orgId, refetch],
  );

  const patchResource = useCallback(
    async (resourceId: string, input: Partial<AdminUpsertResourceInput>) => {
      if (!orgId) throw new Error("No organization");
      await adminUpdateResource(orgId, resourceId, input);
      await refetch();
    },
    [orgId, refetch],
  );

  return { categories, resources, isLoading, error, refetch, addCategory, addResource, patchResource };
}

export function useAdminDocumentTemplatesManage() {
  const { orgId } = useAuth();
  const [templates, setTemplates] = useState<RequiredTemplateView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setTemplates([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setTemplates(await getRequiredTemplates(orgId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (input: AdminRequiredTemplateInput) => {
      if (!orgId) throw new Error("No organization");
      await adminCreateRequiredTemplate(orgId, input);
      await refetch();
    },
    [orgId, refetch],
  );

  const update = useCallback(
    async (templateId: string, input: Partial<AdminRequiredTemplateInput>) => {
      if (!orgId) throw new Error("No organization");
      await adminUpdateRequiredTemplate(orgId, templateId, input);
      await refetch();
    },
    [orgId, refetch],
  );

  return { templates, isLoading, error, refetch, create, update };
}

export function useOrgWorkflowStagesAdmin() {
  const { orgId } = useAuth();
  const [stages, setStages] = useState<OrgWorkflowStageSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setStages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setStages(await getOrgWorkflowStages(orgId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStages([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(
    async (next: OrgWorkflowStageSetting[]) => {
      if (!orgId) throw new Error("No organization");
      await saveOrgWorkflowStages(orgId, next);
      await refetch();
    },
    [orgId, refetch],
  );

  return { stages, isLoading, error, refetch, save };
}
