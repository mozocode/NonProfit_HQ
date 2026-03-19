import { describe, expect, it } from "vitest";

import {
  aggregateSurveyResults,
  buildExportSummaryCards,
  generateLaySummary,
  sortedMonthlyTrend,
} from "@/lib/surveyAggregation";
import type { SurveyQuestionView } from "@/types/surveys";

const questions: SurveyQuestionView[] = [
  {
    questionId: "q1",
    questionText: "Rate us",
    type: "scale",
    options: [],
    order: 0,
  },
  {
    questionId: "q2",
    questionText: "Pick",
    type: "choice",
    options: ["A", "B"],
    order: 1,
  },
];

describe("surveyAggregation", () => {
  it("aggregateSurveyResults counts months and question types", () => {
    const agg = aggregateSurveyResults("s1", "Test", "parent", questions, [
      { answers: { q1: 4, q2: "A" }, submittedAt: "2025-01-15T12:00:00.000Z" },
      { answers: { q1: "6", q2: "B" }, submittedAt: "2025-01-20T12:00:00.000Z" },
    ]);
    expect(agg.totalResponses).toBe(2);
    expect(agg.responsesByMonth["2025-01"]).toBe(2);
    const scale = agg.questions.find((q) => q.questionId === "q1");
    expect(scale?.scaleStats?.average).toBe(5);
    const choice = agg.questions.find((q) => q.questionId === "q2");
    expect(choice?.choiceCounts?.A).toBe(1);
    expect(choice?.choiceCounts?.B).toBe(1);
  });

  it("generateLaySummary handles zero responses", () => {
    const agg = aggregateSurveyResults("s1", "Empty", "staff", questions, []);
    const lay = generateLaySummary(agg);
    expect(lay.headline).toContain("No responses");
  });

  it("buildExportSummaryCards includes participation card", () => {
    const agg = aggregateSurveyResults("s1", "N", "parent", questions, [
      { answers: { q1: 5 }, submittedAt: "2025-02-01T00:00:00.000Z" },
    ]);
    const cards = buildExportSummaryCards(agg, generateLaySummary(agg));
    expect(cards.some((c) => c.id === "participation")).toBe(true);
  });

  it("sortedMonthlyTrend sorts keys", () => {
    expect(sortedMonthlyTrend({ "2025-02": 1, "2025-01": 2 }).map((x) => x.month)).toEqual(["2025-01", "2025-02"]);
  });
});
