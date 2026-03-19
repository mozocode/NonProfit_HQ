"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants";
import type { NextRequiredAction } from "@/types/familyProfile";
import { cn } from "@/lib/utils";

export interface NextRequiredActionBannerProps {
  action: NextRequiredAction;
  className?: string;
}

export function NextRequiredActionBanner({ action, className }: NextRequiredActionBannerProps) {
  const href =
    action.type === "task"
      ? ROUTES.STAFF_TASK(action.id)
      : ROUTES.STAFF_FAMILY(action.familyId);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-status-warning/40 bg-status-warning-muted/50 px-4 py-3 transition-colors hover:bg-status-warning-muted",
        className,
      )}
    >
      <AlertCircle className="size-5 shrink-0 text-status-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Next required action
        </p>
        <p className="font-medium text-foreground">{action.title}</p>
        {action.dueDate ? (
          <p className="text-sm text-muted-foreground">
            Due {new Date(action.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
