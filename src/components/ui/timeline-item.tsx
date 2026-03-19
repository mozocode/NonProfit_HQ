"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  timestamp?: string;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  isLast?: boolean;
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      title,
      description,
      timestamp,
      meta,
      icon,
      isLast = false,
      className,
      ...props
    },
    ref,
  ) => (
    <div ref={ref} className={cn("relative flex gap-4 pb-6", className)} {...props}>
      {!isLast ? (
        <span
          className="absolute left-[11px] top-6 bottom-0 w-px bg-border"
          aria-hidden
        />
      ) : null}
      <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-primary [&_svg]:size-3">
        {icon ?? null}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {timestamp ? (
            <time className="text-xs text-muted-foreground">{timestamp}</time>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {meta ? <div className="pt-1">{meta}</div> : null}
      </div>
    </div>
  ),
);
TimelineItem.displayName = "TimelineItem";

export { TimelineItem };
