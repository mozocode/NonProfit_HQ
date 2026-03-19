"use client";

import { Phone, Mail, Home, MessageSquare } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RecentInteractionView } from "@/types/familyProfile";
import { cn } from "@/lib/utils";

const typeIcons: Record<RecentInteractionView["type"], React.ReactNode> = {
  call: <Phone className="size-4" aria-hidden />,
  visit: <Home className="size-4" aria-hidden />,
  email: <Mail className="size-4" aria-hidden />,
  other: <MessageSquare className="size-4" aria-hidden />,
};

export interface RecentInteractionsListProps {
  interactions: RecentInteractionView[];
  className?: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentInteractionsList({ interactions, className }: RecentInteractionsListProps) {
  if (interactions.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Recent staff interactions</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent interactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">Recent staff interactions</h2>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {interactions.map((i) => (
            <li key={i.interactionId} className="px-4 py-3">
              <div className="flex gap-3">
                <span className="text-muted-foreground">{typeIcons[i.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground capitalize">{i.type}</p>
                  <p className="text-xs text-muted-foreground">{i.staffName}</p>
                  {i.summary ? (
                    <p className="mt-1 text-sm text-muted-foreground">{i.summary}</p>
                  ) : null}
                  <time className="mt-1 block text-xs text-muted-foreground" dateTime={i.occurredAt}>
                    {formatTimestamp(i.occurredAt)}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
