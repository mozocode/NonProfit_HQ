"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { PROMPT_TYPE_LABELS } from "@/types/notifications";
import type { StaffActionPromptView } from "@/types/notifications";
import type { StaffActionPromptType } from "@/types/domain";
import { ChevronRight, CheckCircle, FileText } from "lucide-react";
import { ROUTES } from "@/constants";

export interface PromptCardProps {
  prompt: StaffActionPromptView;
  onLogAction?: (promptId: string, title: string) => void;
  onComplete?: (promptId: string) => void;
  isLogging?: boolean;
  isCompleting?: boolean;
  detailHref?: string;
}

export function PromptCard({
  prompt,
  onLogAction,
  onComplete,
  isLogging,
  isCompleting,
  detailHref,
}: PromptCardProps) {
  const label = PROMPT_TYPE_LABELS[prompt.type as StaffActionPromptType] ?? prompt.type;
  const completed = !!prompt.completedAt;
  const href =
    detailHref ??
    (prompt.type === "missing_weekly_report" ? ROUTES.STAFF_REPORT : ROUTES.STAFF_AGENDA);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{prompt.title}</p>
            {prompt.actionLogCount != null && prompt.actionLogCount > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <FileText className="size-3" />
                {prompt.actionLogCount} action(s) logged
              </p>
            )}
            <DueDateChip dueDate={prompt.dueAt.slice(0, 10)} showIcon={false} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            {!completed && onLogAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLogAction(prompt.promptId, prompt.title)}
                disabled={isLogging}
              >
                Log action
              </Button>
            )}
            {!completed && onComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(prompt.promptId)}
                disabled={isCompleting}
              >
                <CheckCircle className="mr-1 size-4" />
                Complete
              </Button>
            )}
            <Link
              href={href}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
