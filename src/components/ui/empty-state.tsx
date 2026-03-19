"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    const titleId = React.useId();
    return (
      <div
        ref={ref}
        role="region"
        aria-labelledby={titleId}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center",
          className,
        )}
        {...props}
      >
        {icon ? (
          <div className="mb-4 text-muted-foreground [&_svg]:size-10" aria-hidden>
            {icon}
          </div>
        ) : null}
        <h3 id={titleId} className="text-sm font-medium text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
