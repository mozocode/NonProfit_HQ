"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ children, onClear, clearLabel = "Clear filters", className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-label="Filters"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2",
        className,
      )}
      {...props}
    >
      {children}
      {onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          {clearLabel}
        </Button>
      ) : null}
    </div>
  ),
);
FilterBar.displayName = "FilterBar";

export { FilterBar };
