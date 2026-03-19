"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricStatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function MetricStatCard({ label, value, description, icon: Icon, className }: MetricStatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">{label}</CardDescription>
          {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        </div>
        <CardTitle className="text-2xl tabular-nums tracking-tight">{value}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
    </Card>
  );
}
