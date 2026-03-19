"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { REMINDER_TYPE_LABELS } from "@/types/notifications";
import type { ReminderView } from "@/types/notifications";
import type { ReminderType } from "@/types/domain";
import { ChevronRight, Check } from "lucide-react";
import { ROUTES } from "@/constants";

export interface ReminderCardProps {
  reminder: ReminderView;
  onAcknowledge?: (reminderId: string) => void;
  isAcknowledging?: boolean;
  href: string;
}

export function ReminderCard({
  reminder,
  onAcknowledge,
  isAcknowledging,
  href,
}: ReminderCardProps) {
  const label = REMINDER_TYPE_LABELS[reminder.type as ReminderType] ?? reminder.type;
  const acknowledged = !!reminder.acknowledgedAt;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{reminder.title}</p>
            {reminder.familyName && (
              <p className="text-xs text-muted-foreground">{reminder.familyName}</p>
            )}
            <DueDateChip dueDate={reminder.dueAt.slice(0, 10)} showIcon={false} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            {!acknowledged && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(reminder.reminderId)}
                disabled={isAcknowledging}
              >
                <Check className="mr-1 size-4" />
                Ack
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
