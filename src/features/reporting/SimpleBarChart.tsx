"use client";

import { cn } from "@/lib/utils";

export interface SimpleBarRow {
  label: string;
  value: number;
  sublabel?: string;
}

/**
 * Minimal horizontal bar chart (no external chart lib). Good for dashboards and print-friendly views.
 */
export function SimpleBarChart({
  rows,
  valueClassName,
  barClassName,
}: {
  rows: SimpleBarRow[];
  valueClassName?: string;
  barClassName?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className={cn("tabular-nums text-muted-foreground", valueClassName)}>{row.value}</span>
          </div>
          {row.sublabel ? <p className="text-xs text-muted-foreground">{row.sublabel}</p> : null}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-primary transition-[width]", barClassName)}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
