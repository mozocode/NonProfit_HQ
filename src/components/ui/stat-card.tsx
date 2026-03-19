"use client";

import * as React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: string; positive?: boolean };
  icon?: React.ReactNode;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, description, trend, icon, className, ...props }, ref) => (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon ? (
          <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        {(description || trend) ? (
          <div className="mt-1 flex items-baseline gap-2 text-xs text-muted-foreground">
            {description ? <span>{description}</span> : null}
            {trend ? (
              <span
                className={
                  trend.positive === true
                    ? "text-status-success"
                    : trend.positive === false
                      ? "text-status-error"
                      : ""
                }
              >
                {trend.value}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  ),
);
StatCard.displayName = "StatCard";

export { StatCard };
