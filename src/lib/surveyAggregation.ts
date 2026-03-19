/**
 * Pure aggregation and layman-friendly summary generation for survey results.
 */

import type { SurveyAudience } from "@/types/domain";
import type {
  QuestionAggregate,
  SurveyAggregateResult,
  LaySummaryResult,
  ExportSummaryCard,
  SurveyQuestionView,
} from "@/types/surveys";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function parseScaleValue(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Aggregate survey responses into counts, distributions, and monthly trend.
 */
export function aggregateSurveyResults(
  surveyId: string,
  surveyName: string,
  audience: SurveyAudience,
  questions: SurveyQuestionView[],
  responses: Array<{ answers: Record<string, unknown>; submittedAt: string }>
): SurveyAggregateResult {
  const responsesByMonth: Record<string, number> = {};
  for (const r of responses) {
    const k = monthKey(r.submittedAt);
    responsesByMonth[k] = (responsesByMonth[k] ?? 0) + 1;
  }

  const questionAggs: QuestionAggregate[] = questions.map((q) => {
    const base: QuestionAggregate = {
      questionId: q.questionId,
      questionText: q.questionText,
      type: q.type,
      responseCount: 0,
    };

    const values = responses
      .map((r) => r.answers[q.questionId])
      .filter((v) => v !== undefined && v !== null && v !== "");

    base.responseCount = values.length;

    if (q.type === "choice") {
      const choiceCounts: Record<string, number> = {};
      for (const opt of q.options) choiceCounts[opt] = 0;
      for (const v of values) {
        const s = String(v);
        choiceCounts[s] = (choiceCounts[s] ?? 0) + 1;
      }
      base.choiceCounts = choiceCounts;
    }

    if (q.type === "scale") {
      const nums = values.map(parseScaleValue).filter((n): n is number => n !== null);
      base.scaleStats = {
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
        average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
        count: nums.length,
      };
    }

    if (q.type === "text") {
      base.textSamples = values
        .map((v) => String(v).trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    return base;
  });

  return {
    surveyId,
    surveyName,
    audience,
    totalResponses: responses.length,
    questions: questionAggs,
    responsesByMonth,
  };
}

/**
 * Generate plain-language bullets and narrative for stakeholders (grants, newsletters).
 */
export function generateLaySummary(aggregate: SurveyAggregateResult): LaySummaryResult {
  const n = aggregate.totalResponses;
  const audienceLabel =
    aggregate.audience === "parent"
      ? "parents"
      : aggregate.audience === "child"
        ? "children/youth"
        : "staff";

  const headline =
    n === 0
      ? `No responses yet for “${aggregate.surveyName}”.`
      : `“${aggregate.surveyName}” received ${n} response${n === 1 ? "" : "s"} from ${audienceLabel}.`;

  const bullets: string[] = [];

  for (const q of aggregate.questions) {
    if (q.responseCount === 0) continue;
    if (q.type === "choice" && q.choiceCounts) {
      const entries = Object.entries(q.choiceCounts).sort((a, b) => b[1] - a[1]);
      const top = entries[0];
      if (top) {
        const pct = Math.round((top[1] / q.responseCount) * 100);
        bullets.push(
          `For “${truncate(q.questionText, 60)}”, the most common answer was “${top[0]}” (${top[1]} of ${q.responseCount}, about ${pct}%).`
        );
      }
    }
    if (q.type === "scale" && q.scaleStats?.average != null) {
      bullets.push(
        `Average rating for “${truncate(q.questionText, 60)}” was ${q.scaleStats.average.toFixed(1)} (scale ${q.scaleStats.min}–${q.scaleStats.max}).`
      );
    }
    if (q.type === "text" && q.textSamples?.length) {
      bullets.push(
        `We collected ${q.responseCount} written response${q.responseCount === 1 ? "" : "s"} to “${truncate(q.questionText, 50)}…”.`
      );
    }
  }

  const narrative =
    n === 0
      ? `Once participants begin responding, this section will summarize key patterns in everyday language suitable for grant reports and community updates.`
      : [
          headline,
          bullets.length ? `Highlights: ${bullets.slice(0, 3).join(" ")}` : "",
        ]
          .filter(Boolean)
          .join(" ");

  return { headline, bullets, narrative };
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Build 2–4 export-ready cards (headline stat + copy) for grants and newsletters.
 */
export function buildExportSummaryCards(aggregate: SurveyAggregateResult, lay: LaySummaryResult): ExportSummaryCard[] {
  const cards: ExportSummaryCard[] = [];

  cards.push({
    id: "participation",
    title: "Survey participation",
    statLabel: "Total responses",
    statValue: String(aggregate.totalResponses),
    body:
      aggregate.totalResponses === 0
        ? "Share this survey link to begin collecting outcomes data."
        : `${aggregate.totalResponses} people completed “${aggregate.surveyName}” (${aggregate.audience === "staff" ? "staff" : aggregate.audience === "child" ? "youth/family members" : "parents/caregivers"}).`,
    footnote: "Suitable for annual reports and funder updates.",
  });

  const scaleQ = aggregate.questions.find((q) => q.type === "scale" && q.scaleStats?.average != null);
  if (scaleQ?.scaleStats?.average != null) {
    cards.push({
      id: `scale_${scaleQ.questionId}`,
      title: truncate(scaleQ.questionText, 48),
      statLabel: "Average score",
      statValue: scaleQ.scaleStats.average.toFixed(1),
      body: `On average, respondents rated this item ${scaleQ.scaleStats.average.toFixed(1)} on a ${scaleQ.scaleStats.min}–${scaleQ.scaleStats.max} scale (${scaleQ.scaleStats.count} responses).`,
    });
  }

  const topChoice = aggregate.questions.find((q) => q.type === "choice" && q.choiceCounts);
  if (topChoice?.choiceCounts) {
    const sorted = Object.entries(topChoice.choiceCounts).sort((a, b) => b[1] - a[1]);
    const [label, count] = sorted[0] ?? ["", 0];
    if (label && topChoice.responseCount > 0) {
      const pct = Math.round((count / topChoice.responseCount) * 100);
      cards.push({
        id: `choice_${topChoice.questionId}`,
        title: "Top response",
        statLabel: label,
        statValue: `${pct}%`,
        body: `A majority pattern: “${label}” was selected by ${count} of ${topChoice.responseCount} respondents answering “${truncate(topChoice.questionText, 70)}”.`,
      });
    }
  }

  cards.push({
    id: "narrative",
    title: "Story-ready summary",
    statLabel: "Key takeaway",
    statValue: aggregate.totalResponses > 0 ? "See below" : "—",
    body: lay.narrative,
    footnote: "Copy into newsletters, LOIs, or impact sections.",
  });

  return cards;
}

/**
 * Format trend data for simple sparkline / table (sorted months).
 */
export function sortedMonthlyTrend(responsesByMonth: Record<string, number>): Array<{ month: string; count: number }> {
  return Object.entries(responsesByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}
