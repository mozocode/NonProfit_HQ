"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import type { SurveyListItemView } from "@/types/surveys";

const AUDIENCE_LABEL: Record<string, string> = {
  parent: "Parent",
  child: "Child / youth",
  staff: "Staff",
};

export interface SurveysListViewProps {
  title: string;
  description: string;
  surveys: SurveyListItemView[];
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  hrefForSurvey: (id: string) => string;
  backHref?: string;
  backLabel?: string;
  headerActions?: React.ReactNode;
}

export function SurveysListView({
  title,
  description,
  surveys,
  isLoading,
  emptyTitle,
  emptyDescription,
  hrefForSurvey,
  backHref,
  backLabel,
  headerActions,
}: SurveysListViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            {backHref ? (
              <Link className={buttonVariants({ variant: "outline" })} href={backHref}>
                {backLabel ?? "Back"}
              </Link>
            ) : null}
            {headerActions}
          </div>
        }
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : surveys.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {surveys.map((s) => (
            <li key={s.surveyId}>
              <Link href={hrefForSurvey(s.surveyId)}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.description ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{AUDIENCE_LABEL[s.audience] ?? s.audience}</Badge>
                        <Badge variant="outline">{s.status}</Badge>
                        <span className="text-xs text-muted-foreground">{s.questionCount} questions</span>
                      </div>
                    </div>
                    <span className={buttonVariants({ variant: "outline", size: "sm" })}>Open</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
