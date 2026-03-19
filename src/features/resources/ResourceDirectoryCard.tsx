"use client";

import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ResourceView } from "@/types/resources";
import { cn } from "@/lib/utils";

export interface ResourceDirectoryCardProps {
  resource: ResourceView;
  action?: React.ReactNode;
  className?: string;
}

export function ResourceDirectoryCard({ resource, action, className }: ResourceDirectoryCardProps) {
  const displayName = resource.providerName ?? resource.businessName ?? resource.name;
  const sublabel = [resource.providerName && resource.businessName ? resource.businessName : null, resource.categoryName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex min-w-0 gap-3">
          {resource.providerPhotoUrl ? (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
              <img
                src={resource.providerPhotoUrl}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
              {(displayName ?? "?").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{displayName ?? resource.name}</h3>
            {sublabel ? <p className="truncate text-xs text-muted-foreground">{sublabel}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {resource.website ? (
            <a
              href={resource.website.startsWith("http") ? resource.website : `https://${resource.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label="Open website"
            >
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {resource.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
        ) : null}
        {resource.phone ? (
          <p className="text-xs text-muted-foreground">
            <a href={`tel:${resource.phone}`} className="hover:underline">{resource.phone}</a>
          </p>
        ) : null}
        {resource.notes ? (
          <p className="line-clamp-2 text-xs text-muted-foreground italic">{resource.notes}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
