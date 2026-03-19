"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusChip } from "@/components/ui/document-status-chip";
import type { RequirementView } from "@/types/documents";
import { AlertCircle } from "lucide-react";

export interface MissingDocumentsSectionProps {
  requirements: RequirementView[];
  onUploadForRequirement?: (requirement: RequirementView) => void;
  /** Render custom trigger for opening upload (e.g. button with template pre-selected). */
  renderUploadTrigger?: (requirement: RequirementView) => React.ReactNode;
}

export function MissingDocumentsSection({
  requirements,
  onUploadForRequirement,
  renderUploadTrigger,
}: MissingDocumentsSectionProps) {
  const missing = requirements.filter((r) => r.status === "missing");
  if (missing.length === 0) return null;

  return (
    <Card className="border-status-warning/50 bg-status-warning-muted/30">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground">
          <AlertCircle className="size-4 shrink-0 text-status-warning" aria-hidden />
          Missing required documents ({missing.length})
        </div>
        <ul className="divide-y border-t">
          {missing.map((r) => (
            <li
              key={r.requirementId}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.templateName}</p>
                {r.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(r.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DocumentStatusChip status="missing" label="Missing" />
                {renderUploadTrigger ? (
                  renderUploadTrigger(r)
                ) : onUploadForRequirement ? (
                  <button
                    type="button"
                    onClick={() => onUploadForRequirement(r)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Upload
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
