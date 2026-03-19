"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { useRemindersForStaff, useStaffPrompts, useAcknowledgeReminder, useCompletePrompt, useLogPromptAction } from "@/hooks/useRemindersPrompts";
import { ROUTES } from "@/constants";
import { ReminderCard } from "@/features/reminders/ReminderCard";
import { PromptCard } from "@/features/reminders/PromptCard";
import { LogActionSheet } from "@/features/reminders/LogActionSheet";
import { Bell } from "lucide-react";

type TabFilter = "all" | "reminders" | "prompts";
type ReminderFilter = "all" | "unacknowledged" | "acknowledged";

export function ReminderCenterView() {
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>("unacknowledged");
  const [logActionPromptId, setLogActionPromptId] = useState<string | null>(null);
  const [logActionPromptTitle, setLogActionPromptTitle] = useState("");

  const { reminders, isLoading: remindersLoading, refetch: refetchReminders } = useRemindersForStaff();
  const { prompts, isLoading: promptsLoading, refetch: refetchPrompts } = useStaffPrompts({ completedOnly: false });
  const { acknowledge, isAcknowledging } = useAcknowledgeReminder();
  const { complete, isCompleting } = useCompletePrompt();
  const { logAction, isLogging } = useLogPromptAction();

  const displayReminders =
    reminderFilter === "unacknowledged"
      ? reminders.filter((r) => !r.acknowledgedAt)
      : reminderFilter === "acknowledged"
        ? reminders.filter((r) => !!r.acknowledgedAt)
        : reminders;
  const isLoading = remindersLoading || promptsLoading;

  const handleAcknowledge = async (reminderId: string) => {
    await acknowledge(reminderId);
    refetchReminders();
  };

  const handleComplete = async (promptId: string) => {
    await complete(promptId);
    refetchPrompts();
  };

  const handleLogAction = async (promptId: string, input: { date: string; method: string; outcome: string }) => {
    await logAction(promptId, input);
    refetchPrompts();
    setLogActionPromptId(null);
  };

  const openLogSheet = (promptId: string, title: string) => {
    setLogActionPromptId(promptId);
    setLogActionPromptTitle(title);
  };

  if (isLoading && reminders.length === 0 && prompts.length === 0) {
    return <LoadingState message="Loading reminder center…" />;
  }

  const showReminders = tabFilter === "all" || tabFilter === "reminders";
  const showPrompts = tabFilter === "all" || tabFilter === "prompts";
  const hasReminders = displayReminders.length > 0;
  const hasPrompts = prompts.length > 0;
  const hasAny = hasReminders || hasPrompts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminder center"
        description="Reminders and action prompts that need your attention."
      />

      <FilterBar>
        {(["all", "reminders", "prompts"] as const).map((f) => (
          <Button
            key={f}
            variant={tabFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setTabFilter(f)}
          >
            {f === "all" ? "All" : f === "reminders" ? "Reminders" : "Action prompts"}
          </Button>
        ))}
      </FilterBar>

      {showReminders && (
        <Section
          title="Reminders"
          action={
            tabFilter === "reminders" || tabFilter === "all" ? (
              <FilterBar>
                {(["unacknowledged", "acknowledged", "all"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={reminderFilter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReminderFilter(f)}
                  >
                    {f === "unacknowledged" ? "Needing ack" : f === "acknowledged" ? "Acknowledged" : "All"}
                  </Button>
                ))}
              </FilterBar>
            ) : null
          }
        >
          {!hasReminders ? (
            <EmptyState
              icon={<Bell className="size-10" />}
              title="No reminders"
              description={
                reminderFilter === "unacknowledged"
                  ? "You have no reminders needing acknowledgment."
                  : "No reminders in this filter."
              }
            />
          ) : (
            <ul className="space-y-3">
              {displayReminders.map((r) => (
                <li key={r.reminderId}>
                  <ReminderCard
                    reminder={r}
                    onAcknowledge={handleAcknowledge}
                    isAcknowledging={isAcknowledging}
                    href={r.familyId ? ROUTES.STAFF_FAMILY(r.familyId) : ROUTES.STAFF_TASK(r.targetId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {showPrompts && (
        <Section title="Action prompts">
          {!hasPrompts ? (
            <EmptyState
              icon={<Bell className="size-10" />}
              title="No action prompts"
              description="No unresolved action prompts."
            />
          ) : (
            <ul className="space-y-3">
              {prompts.map((p) => (
                <li key={p.promptId}>
                  <PromptCard
                    prompt={p}
                    onLogAction={openLogSheet}
                    onComplete={handleComplete}
                    isLogging={isLogging}
                    isCompleting={isCompleting}
                    detailHref={p.type === "missing_weekly_report" ? ROUTES.STAFF_REPORT : ROUTES.STAFF_AGENDA}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {!hasAny && tabFilter === "all" && (
        <EmptyState
          icon={<Bell className="size-10" />}
          title="All caught up"
          description="No reminders or action prompts need your attention."
        />
      )}

      <LogActionSheet
        open={!!logActionPromptId}
        onOpenChange={(open) => !open && setLogActionPromptId(null)}
        promptTitle={logActionPromptTitle}
        onLog={logActionPromptId ? (input) => handleLogAction(logActionPromptId, input) : async () => {}}
        isLogging={isLogging}
      />
    </div>
  );
}
