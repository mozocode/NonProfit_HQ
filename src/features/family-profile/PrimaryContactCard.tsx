"use client";

import { Mail, Phone } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FamilyProfileSummary } from "@/types/familyProfile";
import { cn } from "@/lib/utils";

export interface PrimaryContactCardProps {
  summary: FamilyProfileSummary;
  className?: string;
}

export function PrimaryContactCard({ summary, className }: PrimaryContactCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold text-foreground">Primary contact</h2>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium text-foreground">{summary.primaryContactName}</p>
        {summary.primaryContactPhone ? (
          <a
            href={`tel:${summary.primaryContactPhone}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            {summary.primaryContactPhone}
          </a>
        ) : null}
        {summary.primaryContactEmail ? (
          <a
            href={`mailto:${summary.primaryContactEmail}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Mail className="size-4 shrink-0" aria-hidden />
            {summary.primaryContactEmail}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
