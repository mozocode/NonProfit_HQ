"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12",
        className,
      )}
      {...props}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label={message ?? "Loading"}
      />
      {message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {message}
        </p>
      ) : null}
    </div>
  ),
);
LoadingState.displayName = "LoadingState";

export { LoadingState };
