"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  getLatestAssessmentByFamily,
  saveAssessmentDraft,
  submitAssessment,
} from "@/services/firestore/intakeEnrollmentAssessmentService";
import type { AssessmentDocument, AssessmentFormData } from "@/types/intakeEnrollmentAssessment";

export function useAssessmentMutation(familyId: string | null) {
  const { orgId, user } = useAuth();
  const [existing, setExisting] = useState<AssessmentDocument | null>(null);
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
      const doc = await getLatestAssessmentByFamily(orgId, familyId);
      setExisting(doc);
      setLoadStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load assessment"));
      setExisting(null);
      setLoadStatus("error");
    }
  }, [orgId, familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const saveDraft = useCallback(
    async (data: AssessmentFormData) => {
      if (!orgId || !familyId || !user?.uid) {
        throw new Error("Not authenticated or missing family");
      }
      setSaveStatus("saving");
      setError(null);
      try {
        await saveAssessmentDraft(
          orgId,
          familyId,
          user.uid,
          data,
          existing?.status === "draft" ? existing.assessmentId : null,
        );
        setSaveStatus("success");
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to save draft"));
        setSaveStatus("error");
        throw e;
      }
    },
    [orgId, familyId, user?.uid, existing, refetch],
  );

  const submit = useCallback(
    async (data: AssessmentFormData) => {
      if (!orgId || !familyId || !user?.uid) {
        throw new Error("Not authenticated or missing family");
      }
      setSaveStatus("saving");
      setError(null);
      try {
        await submitAssessment(
          orgId,
          familyId,
          user.uid,
          data,
          existing?.status === "draft" ? existing.assessmentId : null,
        );
        setSaveStatus("success");
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to submit"));
        setSaveStatus("error");
        throw e;
      }
    },
    [orgId, familyId, user?.uid, existing, refetch],
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
