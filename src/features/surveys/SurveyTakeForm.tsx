"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitSurvey } from "@/hooks/useSurveys";
import type { SurveyWithQuestionsView } from "@/types/surveys";
import { Loader2 } from "lucide-react";

const DEFAULT_SCALE = [1, 2, 3, 4, 5];

export interface SurveyTakeFormProps {
  survey: SurveyWithQuestionsView;
  onSuccess?: () => void;
  familyId?: string | null;
  respondentMemberId?: string | null;
}

export function SurveyTakeForm({
  survey,
  onSuccess,
  familyId,
  respondentMemberId,
}: SurveyTakeFormProps) {
  const { submit, isSubmitting } = useSubmitSurvey();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const q of survey.questions) {
      const v = answers[q.questionId]?.trim();
      if (!v) {
        setError(`Please answer: ${q.questionText}`);
        return;
      }
    }
    try {
      const payload: Record<string, unknown> = {};
      for (const q of survey.questions) {
        const raw = answers[q.questionId];
        if (q.type === "scale") {
          payload[q.questionId] = parseFloat(raw) || raw;
        } else {
          payload[q.questionId] = raw;
        }
      }
      await submit(
        {
          surveyId: survey.surveyId,
          answers: payload,
          familyId,
          respondentMemberId,
        },
        survey.audience
      );
      onSuccess?.();
    } catch {
      setError("Could not submit. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {survey.description ? (
        <p className="text-sm text-muted-foreground">{survey.description}</p>
      ) : null}
      {survey.questions.map((q, idx) => (
        <Card key={q.questionId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {idx + 1}. {q.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.type === "text" && (
              <Textarea
                value={answers[q.questionId] ?? ""}
                onChange={(e) => setAnswer(q.questionId, e.target.value)}
                rows={4}
                placeholder="Your answer"
              />
            )}
            {q.type === "choice" && (
              <div className="space-y-2" role="group" aria-label={q.questionText}>
                {q.options.map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.questionId}
                      value={opt}
                      checked={answers[q.questionId] === opt}
                      onChange={() => setAnswer(q.questionId, opt)}
                      className="size-4"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "scale" && (
              <div className="flex flex-wrap gap-2" role="group" aria-label={q.questionText}>
                {(q.options.length > 0 ? q.options : DEFAULT_SCALE.map(String)).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={answers[q.questionId] === opt ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnswer(q.questionId, opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit survey"
        )}
      </Button>
    </form>
  );
}
