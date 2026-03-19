"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { withRetry } from "@/lib/retry";
import {
  getSurveys,
  getSurveyWithQuestions,
  getSurveyResponses,
  submitSurveyResponse,
  createSurvey,
} from "@/services/firestore/surveysService";
import {
  aggregateSurveyResults,
  generateLaySummary,
  buildExportSummaryCards,
  sortedMonthlyTrend,
} from "@/lib/surveyAggregation";
import type { SurveyAudience } from "@/types/domain";
import type { SurveyListItemView, SurveyWithQuestionsView, SubmitSurveyInput, CreateSurveyInput } from "@/types/surveys";

export function useSurveysList(filters?: {
  status?: "draft" | "active" | "closed";
  audience?: SurveyAudience | SurveyAudience[];
}) {
  const { orgId } = useAuth();
  const [surveys, setSurveys] = useState<SurveyListItemView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setSurveys([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await getSurveys(orgId, filters);
      setSurveys(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSurveys([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, filters?.status, filters?.audience]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { surveys, isLoading, error, refetch };
}

export function useSurveyDetail(surveyId: string | null) {
  const { orgId } = useAuth();
  const [survey, setSurvey] = useState<SurveyWithQuestionsView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !surveyId) {
      setSurvey(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const s = await getSurveyWithQuestions(orgId, surveyId);
      setSurvey(s);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSurvey(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, surveyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { survey, isLoading, error, refetch };
}

export function useSubmitSurvey() {
  const { orgId, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (input: SubmitSurveyInput, audience: SurveyAudience) => {
      if (!orgId || !user?.uid) throw new Error("Not signed in");
      setIsSubmitting(true);
      try {
        return await submitSurveyResponse(orgId, user.uid, input, audience);
      } finally {
        setIsSubmitting(false);
      }
    },
    [orgId, user?.uid]
  );

  return { submit, isSubmitting };
}

export function useSurveyReport(surveyId: string | null) {
  const { orgId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !surveyId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const [survey, responses] = await withRetry(
        () =>
          Promise.all([getSurveyWithQuestions(orgId, surveyId), getSurveyResponses(orgId, surveyId)]),
        { maxAttempts: 2, baseDelayMs: 600 },
      );
      if (!survey) return null;
      const aggregate = aggregateSurveyResults(
        survey.surveyId,
        survey.name,
        survey.audience,
        survey.questions,
        responses
      );
      const lay = generateLaySummary(aggregate);
      const cards = buildExportSummaryCards(aggregate, lay);
      const trend = sortedMonthlyTrend(aggregate.responsesByMonth);
      return { survey, aggregate, lay, cards, trend, responses };
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [orgId, surveyId]);

  const [data, setData] = useState<Awaited<ReturnType<typeof load>>>(null);

  const refetch = useCallback(async () => {
    const d = await load();
    setData(d);
  }, [load]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useCreateSurvey() {
  const { orgId, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const create = useCallback(
    async (input: CreateSurveyInput) => {
      if (!orgId || !user?.uid) throw new Error("Not signed in");
      setIsCreating(true);
      try {
        return await createSurvey(orgId, user.uid, input);
      } finally {
        setIsCreating(false);
      }
    },
    [orgId, user?.uid]
  );

  return { create, isCreating };
}
