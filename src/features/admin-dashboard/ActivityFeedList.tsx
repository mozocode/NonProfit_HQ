"use client";

import Link from "next/link";
import { FileUp, GitBranch, MessageSquare, Share2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityFeedItem, ActivityFeedKind } from "@/types/commandCenter";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  ActivityFeedKind,
  { label: string; icon: typeof MessageSquare; className: string }
> = {
  interaction: { label: "Interaction", icon: MessageSquare, className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  document: { label: "Document", icon: FileUp, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  referral: { label: "Referral", icon: Share2, className: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  workflow: { label: "Workflow", icon: GitBranch, className: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
};

function formatAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso.slice(0, 16);
  }
}

export function ActivityFeedList({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity in this range"
        description="Try widening the date range or clearing school/partner/program filters."
      />
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) => {
        const meta = kindMeta[item.kind];
        const Icon = meta.icon;
        const inner = (
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    meta.className,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {meta.label}
                </span>
                <time className="text-xs text-muted-foreground tabular-nums" dateTime={item.at}>
                  {formatAt(item.at)}
                </time>
              </div>
              <p className="font-medium text-foreground">{item.title}</p>
              {item.subtitle ? <p className="text-sm text-muted-foreground">{item.subtitle}</p> : null}
            </div>
            {item.href ? (
              <span className="shrink-0 text-sm font-medium text-primary">View →</span>
            ) : null}
          </div>
        );

        return (
          <li key={item.id} className="px-4">
            {item.href ? (
              <Link href={item.href} className="-mx-4 block rounded-md px-4 transition-colors hover:bg-muted/60">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityFeedCard({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
        <CardDescription>
          Interactions, uploads, referrals, and workflow events in the selected range (newest first).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityFeedList items={items} />
      </CardContent>
    </Card>
  );
}
