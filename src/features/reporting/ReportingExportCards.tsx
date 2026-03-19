"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportingExportCard } from "@/types/reporting";

export function ReportingExportCards({ cards }: { cards: ReportingExportCard[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCard = async (card: ReportingExportCard) => {
    const text = `${card.title}\n${card.statLabel}: ${card.statValue}\n\n${card.body}${card.footnote ? `\n\n${card.footnote}` : ""}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.id} className="border-dashed bg-muted/20">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                  Grant / newsletter ready
                </CardDescription>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copyCard(card)}>
                {copiedId === card.id ? (
                  <Check className="size-4 text-status-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{card.statLabel}</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{card.statValue}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{card.body}</p>
            {card.footnote ? <p className="text-xs italic text-muted-foreground">{card.footnote}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
