"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getStandardStages, getStageLabel, isStageReached } from "@/lib/workflowUtils";

export interface WorkflowStepperProps {
  currentStage: string;
  className?: string;
  /** Optional: stages to show (defaults to standard). For future template-driven. */
  stages?: readonly string[];
}

export function WorkflowStepper({ currentStage, className, stages }: WorkflowStepperProps) {
  const list = stages ?? getStandardStages();
  const currentOrder = list.indexOf(currentStage as (typeof list)[number]);
  const isReached = (stageId: string) => isStageReached(stageId, currentStage);
  const isCurrent = (stageId: string) => stageId === currentStage;

  return (
    <div className={cn("w-full", className)} role="list" aria-label="Workflow stages">
      <div className="flex items-center justify-between gap-0">
        {list.map((stageId, index) => {
          const reached = isReached(stageId);
          const current = isCurrent(stageId);
          const isLast = index === list.length - 1;
          return (
            <div key={stageId} className="flex flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 min-w-0",
                      reached ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                    "size-9 sm:size-10",
                    current && "border-primary bg-primary text-primary-foreground",
                    reached && !current && "border-primary bg-primary/10 text-primary",
                    !reached && "border-muted bg-muted/50 text-muted-foreground",
                  )}
                  aria-current={current ? "step" : undefined}
                  title={getStageLabel(stageId)}
                >
                  {reached && !current ? (
                    <Check className="size-4 sm:size-5" aria-hidden />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {!isLast ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 min-w-0",
                      reached && !current ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-2 text-center text-xs font-medium sm:text-sm",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {getStageLabel(stageId)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
