"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { LogInteractionSheet } from "@/features/interactions/LogInteractionSheet";
import { INTERACTION_TYPE_LABELS } from "@/features/interactions/interactionTypeLabels";
import type { InteractionView } from "@/types/notesInteractions";
import type { CreateInteractionInput } from "@/types/notesInteractions";
import { Phone } from "lucide-react";

export interface InteractionsTabProps {
  familyId: string;
  interactions: InteractionView[];
  isLoading: boolean;
  onLogInteraction: (input: CreateInteractionInput) => Promise<void>;
  isSubmitting: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InteractionsTab({
  familyId,
  interactions,
  isLoading,
  onLogInteraction,
  isSubmitting,
}: InteractionsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading interactions…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section
        title="Meeting logs & interactions"
        description="Calls, meetings, check-ins, referral follow-ups."
        action={
          <LogInteractionSheet
            familyId={familyId}
            onSubmit={onLogInteraction}
            isSubmitting={isSubmitting}
          />
        }
      >
        {interactions.length === 0 ? (
          <EmptyState
            icon={<Phone className="size-10" />}
            title="No interactions yet"
            description="Log a call, meeting, check-in, or referral follow-up."
          />
        ) : (
          <ul className="space-y-3">
            {interactions.map((i) => (
              <li key={i.interactionId}>
                <Card>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {INTERACTION_TYPE_LABELS[i.type] ?? i.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(i.occurredAt)}
                        {i.durationMinutes != null ? ` · ${i.durationMinutes} min` : ""}
                      </span>
                    </div>
                    {i.summary ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {i.summary}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
