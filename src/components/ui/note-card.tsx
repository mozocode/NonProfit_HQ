"use client";

import * as React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface NoteCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  content: string;
  author?: string;
  timestamp?: string;
  visibility?: "internal" | "shared";
}

const NoteCard = React.forwardRef<HTMLDivElement, NoteCardProps>(
  (
    { title, content, author, timestamp, visibility, className, ...props },
    ref,
  ) => (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? (
            <span className="text-sm font-medium text-foreground">{title}</span>
          ) : null}
          {visibility ? (
            <span className="text-xs text-muted-foreground capitalize">
              {visibility}
            </span>
          ) : null}
        </div>
        {(author || timestamp) ? (
          <p className="text-xs text-muted-foreground">
            {[author, timestamp].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="whitespace-pre-wrap text-sm text-foreground">{content}</p>
      </CardContent>
    </Card>
  ),
);
NoteCard.displayName = "NoteCard";

export { NoteCard };
