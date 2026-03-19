/**
 * Survey and outcomes view types for UI and aggregation.
 */

import type { SurveyAudience } from "@/types/domain";

export type { SurveyAudience };

export interface SurveyListItemView {
  surveyId: string;
  name: string;
  description: string | null;
  audience: SurveyAudience;
  status: "draft" | "active" | "closed";
  questionCount: number;
  responseCount?: number;
}

export interface SurveyQuestionView {
  questionId: string;
  order: number;
  type: "text" | "choice" | "scale";
  questionText: string;
  options: string[];
}

export interface SurveyWithQuestionsView {
  surveyId: string;
  organizationId: string;
  name: string;
  description: string | null;
  audience: SurveyAudience;
  status: "draft" | "active" | "closed";
  questions: SurveyQuestionView[];
}

export interface SubmitSurveyInput {
  surveyId: string;
  answers: Record<string, unknown>;
  familyId?: string | null;
  respondentMemberId?: string | null;
}

export interface CreateSurveyQuestionInput {
  order: number;
  type: "text" | "choice" | "scale";
  questionText: string;
  options?: string[];
}

export interface CreateSurveyInput {
  name: string;
  description?: string | null;
  audience: SurveyAudience;
  status?: "draft" | "active";
  questions: CreateSurveyQuestionInput[];
}

/** Per-question aggregation for reporting */
export interface QuestionAggregate {
  questionId: string;
  questionText: string;
  type: "text" | "choice" | "scale";
  responseCount: number;
  /** choice: option -> count */
  choiceCounts?: Record<string, number>;
  /** scale: min, max, average (if numeric) */
  scaleStats?: { min: number; max: number; average: number | null; count: number };
  /** text: sample excerpts (non-PII display; truncate in UI) */
  textSamples?: string[];
}

export interface SurveyAggregateResult {
  surveyId: string;
  surveyName: string;
  audience: SurveyAudience;
  totalResponses: number;
  questions: QuestionAggregate[];
  /** Month key YYYY-MM -> count (from submittedAt) */
  responsesByMonth: Record<string, number>;
}

export interface LaySummaryResult {
  headline: string;
  bullets: string[];
  /** Short paragraph for grants/newsletters */
  narrative: string;
}

export interface ExportSummaryCard {
  id: string;
  title: string;
  statLabel: string;
  statValue: string;
  body: string;
  footnote?: string;
}
