"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ title, description, action, className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="region"
      aria-label={title}
      className={cn("space-y-4", className)}
      {...props}
    >
      {(title || action) ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          {title ? (
            <div>
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  ),
);
Section.displayName = "Section";

export { Section };
