"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDocumentsForFamily,
  getRequiredTemplates,
  uploadDocument,
  updateDocumentStatus,
  getDocumentDownloadUrl,
} from "@/services/firestore/documentsService";
import type { DocumentsForFamilyResult, RequiredTemplateView, UploadDocumentInput } from "@/types/documents";

export interface UseFamilyDocumentsOptions {
  organizationId: string | null;
  familyId: string | null;
  enabled?: boolean;
}

export function useFamilyDocuments({
  organizationId,
  familyId,
  enabled = true,
}: UseFamilyDocumentsOptions) {
  const [data, setData] = useState<DocumentsForFamilyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!organizationId || !familyId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocumentsForFamily(organizationId, familyId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, familyId, enabled]);

  useEffect(() => {
    if (enabled && organizationId && familyId) refetch();
  }, [enabled, organizationId, familyId, refetch]);

  return {
    requirements: data?.requirements ?? [],
    documents: data?.documents ?? [],
    isLoading,
    error,
    refetch,
  };
}

export interface UseDocumentUploadOptions {
  organizationId: string | null;
  familyId: string | null;
  uploadedBy: string;
  onSuccess?: () => void;
}

export function useDocumentUpload({
  organizationId,
  familyId,
  uploadedBy,
  onSuccess,
}: UseDocumentUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (input: Omit<UploadDocumentInput, "familyId">) => {
      if (!organizationId || !familyId) {
        setError(new Error("Organization or family not set"));
        return null;
      }
      setIsUploading(true);
      setError(null);
      try {
        const documentId = await uploadDocument(organizationId, uploadedBy, {
          ...input,
          familyId,
        });
        onSuccess?.();
        return documentId;
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [organizationId, familyId, uploadedBy, onSuccess]
  );

  return { upload, isUploading, error };
}

export function useDocumentDownloadUrl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      return await getDocumentDownloadUrl(storagePath);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getUrl, loading, error };
}

export function useRequiredTemplates(organizationId: string | null, enabled = true) {
  const [templates, setTemplates] = useState<RequiredTemplateView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!organizationId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await getRequiredTemplates(organizationId);
      setTemplates(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, enabled]);

  useEffect(() => {
    if (enabled && organizationId) refetch();
  }, [enabled, organizationId, refetch]);

  return { templates, isLoading, error, refetch };
}
