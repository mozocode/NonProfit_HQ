"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import { DueDateChip } from "@/components/ui/due-date-chip";
import type { AttentionSummaryItem } from "@/types/notifications";
import { AlertCircle, Bell } from "lucide-react";
import { ROUTES } from "@/constants";

export interface WhatNeedsAttentionSectionProps {
  items: AttentionSummaryItem[];
  isLoading?: boolean;
}

export function WhatNeedsAttentionSection({
  items,
  isLoading,
}: WhatNeedsAttentionSectionProps) {
  const todayItems = items.slice(0, 10);

  if (isLoading) {
    return (
      <Section title="What needs attention today">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      </Section>
    );
  }

  if (todayItems.length === 0) {
    return (
      <Section
        title="What needs attention today"
        action={
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_REMINDERS}>
            Reminder center
          </Link>
        }
      >
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No reminders or prompts need attention right now.</p>
          </CardContent>
        </Card>
      </Section>
    );
  }

  return (
    <Section
      title="What needs attention today"
      action={
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_REMINDERS}>
          <Bell className="mr-2 size-4" />
          Reminder center ({items.length})
        </Link>
      }
    >
      <Card className="border-status-warning/30">
        <CardContent className="p-0">
          <ul className="divide-y">
            {todayItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-status-warning" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.familyName && (
                        <p className="text-xs text-muted-foreground">{item.familyName}</p>
                      )}
                    </div>
                  </div>
                  <DueDateChip dueDate={item.dueAt.slice(0, 10)} showIcon={false} />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Section>
  );
}
