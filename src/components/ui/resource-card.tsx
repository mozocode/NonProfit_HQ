"use client";

import { ExternalLink } from "lucide-react";
import * as React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ResourceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  description?: string;
  category?: string;
  link?: string;
  contact?: string;
  action?: React.ReactNode;
}

const ResourceCard = React.forwardRef<HTMLDivElement, ResourceCardProps>(
  (
    { name, description, category, link, contact, action, className, ...props },
    ref,
  ) => (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {name}
            </h3>
            {category ? (
              <span className="text-xs text-muted-foreground">{category}</span>
            ) : null}
          </div>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-primary"
              aria-label={`Open ${name}`}
            >
              <ExternalLink className="size-4" />
            </a>
          ) : action ? (
            action
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        {contact ? (
          <p className="text-xs text-muted-foreground">{contact}</p>
        ) : null}
      </CardContent>
    </Card>
  ),
);
ResourceCard.displayName = "ResourceCard";

export { ResourceCard };
