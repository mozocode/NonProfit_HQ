"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSurveyReport } from "@/hooks/useSurveys";
import { ExportSummaryCards } from "@/features/surveys/ExportSummaryCards";
import { ROUTES } from "@/constants";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

export function AdminSurveyReportView({ surveyId }: { surveyId: string }) {
  const { data, isLoading, error, refetch } = useSurveyReport(surveyId);

  if (isLoading && !data) {
    return <LoadingState message="Loading survey report…" />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load report"
        description={error?.message ?? "Survey not found."}
        action={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.ADMIN_SURVEYS}>
            Back to surveys
          </Link>
        }
      />
    );
  }

  const { survey, aggregate, lay, cards, trend } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={survey.name}
        description={`Audience: ${survey.audience} · ${aggregate.totalResponses} response${aggregate.totalResponses === 1 ? "" : "s"}`}
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.ADMIN_SURVEYS}>
            All surveys
          </Link>
        }
      />

      <Section title="Lay summary" description="Plain-language highlights for stakeholders.">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lay.headline}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
              {lay.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {lay.bullets.length === 0 && aggregate.totalResponses === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </Section>

      <Section title="Export-ready summary cards" description="Copy for grants, newsletters, and annual reports.">
        <ExportSummaryCards cards={cards} />
      </Section>

      <Section title="Response counts by month" description="Simple trend of submissions.">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Responses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trend.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  trend.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section title="Results by question" description="Counts and distributions.">
        <div className="space-y-6">
          {aggregate.questions.map((q) => (
            <Card key={q.questionId}>
              <CardHeader>
                <CardDescription className="text-xs uppercase">{q.type}</CardDescription>
                <CardTitle className="text-base">{q.questionText}</CardTitle>
                <CardDescription>{q.responseCount} response(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.type === "choice" && q.choiceCounts && (
                  <div className="space-y-2">
                    {Object.entries(q.choiceCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => {
                        const pct = q.responseCount ? Math.round((count / q.responseCount) * 100) : 0;
                        return (
                          <div key={label}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>{label}</span>
                              <span className="tabular-nums text-muted-foreground">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {q.type === "scale" && q.scaleStats && (
                  <p className="text-sm">
                    Average: <strong>{q.scaleStats.average?.toFixed(2) ?? "—"}</strong> · Range:{" "}
                    {q.scaleStats.min}–{q.scaleStats.max} · N = {q.scaleStats.count}
                  </p>
                )}
                {q.type === "text" && q.textSamples && q.textSamples.length > 0 && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {q.textSamples.slice(0, 8).map((t, i) => (
                      <li key={i} className="rounded-md border bg-muted/30 p-2">
                        “{t.length > 200 ? `${t.slice(0, 200)}…` : t}”
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="button" className={buttonVariants({ variant: "outline" })} onClick={() => refetch()}>
          Refresh data
        </button>
      </div>
    </div>
  );
}
