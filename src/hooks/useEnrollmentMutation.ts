"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  getEnrollmentByFamily,
  saveEnrollmentDraft,
  submitEnrollment,
} from "@/services/firestore/intakeEnrollmentAssessmentService";
import type { EnrollmentDocument, EnrollmentFormData } from "@/types/intakeEnrollmentAssessment";

export function useEnrollmentMutation(familyId: string | null) {
  const { orgId, user } = useAuth();
  const [existing, setExisting] = useState<EnrollmentDocument | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !familyId) {
      setExisting(null);
      setLoadStatus("idle");
      return;
    }
    setLoadStatus("loading");
    setError(null);
    try {
      const doc = await getEnrollmentByFamily(orgId, familyId);
      setExisting(doc);
      setLoadStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load enrollment"));
      setExisting(null);
      setLoadStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const saveDraft = useCallback(
    async (data: EnrollmentFormData) => {
      if (!orgId || !familyId || !user?.uid) {
        throw new Error("Not authenticated or missing family");
      }
      setSaveStatus("saving");
      setError(null);
      try {
        await saveEnrollmentDraft(orgId, familyId, user.uid, data);
        setSaveStatus("success");
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to save draft"));
        setSaveStatus("error");
        throw e;
      }
    },
    [orgId, familyId, user?.uid, refetch],
  );

  const submit = useCallback(
    async (data: EnrollmentFormData) => {
      if (!orgId || !familyId || !user?.uid) {
        throw new Error("Not authenticated or missing family");
      }
      setSaveStatus("saving");
      setError(null);
      try {
        await submitEnrollment(orgId, familyId, user.uid, data);
        setSaveStatus("success");
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to submit"));
        setSaveStatus("error");
        throw e;
      }
    },
    [orgId, familyId, user?.uid, refetch],
  );

  return {
    existing,
    isLoading: loadStatus === "loading",
    isSaving: saveStatus === "saving",
    error,
    refetch,
    saveDraft,
    submit,
  };
}
