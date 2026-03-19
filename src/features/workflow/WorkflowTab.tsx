"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { getStageLabel } from "@/lib/workflowUtils";
import { ChangeStageSheet } from "@/features/workflow/ChangeStageSheet";
import { WorkflowNextActionCard } from "@/features/workflow/WorkflowNextActionCard";
import { WorkflowStageHistory } from "@/features/workflow/WorkflowStageHistory";
import { WorkflowStepper } from "@/features/workflow/WorkflowStepper";
import type { FamilyWorkflowState } from "@/types/workflow";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2 } from "lucide-react";

export interface WorkflowTabProps {
  familyId: string;
  state: FamilyWorkflowState | null;
  isLoading: boolean;
  onStageChange: (stage: string, note?: string) => Promise<void>;
  isUpdating: boolean;
}

export function WorkflowTab({
  familyId,
  state,
  isLoading,
  onStageChange,
  isUpdating,
}: WorkflowTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!state) {
    return (
      <EmptyState
        title="Workflow unavailable"
        description="Could not load workflow state for this family."
      />
    );
  }

  const { currentStage, stageHistory, nextAction, isOverdue } = state;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Current stage</h2>
          <Badge variant="secondary" className="capitalize">
            {getStageLabel(currentStage)}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
        <ChangeStageSheet
          currentStage={currentStage}
          onStageChange={onStageChange}
          isUpdating={isUpdating}
        />
      </div>

      <Section title="Pipeline" description="Standard workflow stages.">
        <WorkflowStepper currentStage={currentStage} />
      </Section>

      <Section title="Next action" description="Required task or follow-up.">
        <WorkflowNextActionCard nextAction={nextAction} isOverdue={isOverdue} />
      </Section>

      <Section title="Stage history" description="When the family moved between stages.">
        <WorkflowStageHistory entries={stageHistory} />
      </Section>

      <Section
        title="Tasks in this stage"
        description="Custom tasks for the current stage. View all tasks in the Tasks tab."
      >
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_FAMILY(familyId)}>
          View family profile · Tasks tab
        </Link>
      </Section>
    </div>
  );
}
