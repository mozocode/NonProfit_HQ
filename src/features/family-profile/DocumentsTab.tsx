"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusChip } from "@/components/ui/document-status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { Select } from "@/components/ui/select";
import { DocumentUploadSheet } from "@/features/documents/DocumentUploadSheet";
import { MissingDocumentsSection } from "@/features/documents/MissingDocumentsSection";
import type { FamilyProfileData } from "@/types/familyProfile";
import type { DocumentView, RequirementView, RequiredTemplateView } from "@/types/documents";
import { FileQuestion, Download, FileUp } from "lucide-react";

export interface DocumentsTabProps {
  data: FamilyProfileData;
  /** When provided, use live requirements/documents and show upload/download/status. */
  requirementsFromHook?: RequirementView[];
  documentsFromHook?: DocumentView[];
  isLoadingDocuments?: boolean;
  templates?: RequiredTemplateView[];
  members?: { memberId: string; name: string }[];
  onUpload?: (templateId: string, file: File, memberId?: string | null) => Promise<boolean>;
  isUploading?: boolean;
  onDownload?: (storagePath: string) => void;
  onStatusChange?: (documentId: string, status: "pending" | "approved" | "rejected") => void;
}

export function DocumentsTab({
  data,
  requirementsFromHook,
  documentsFromHook,
  isLoadingDocuments,
  templates = [],
  members = [],
  onUpload,
  isUploading = false,
  onDownload,
  onStatusChange,
}: DocumentsTabProps) {
  const requirements = requirementsFromHook ?? data.documentRequirements.map((r) => ({
    requirementId: r.requirementId,
    templateId: "",
    templateName: r.templateName,
    status: r.status as RequirementView["status"],
    dueDate: r.dueDate,
    completedAt: null,
  }));
  const documents = documentsFromHook ?? data.documents.map((d) => ({
    documentId: d.documentId,
    templateId: d.templateId ?? "",
    templateName: d.templateName,
    fileName: d.fileName,
    storagePath: d.storagePath ?? "",
    memberId: d.memberId ?? null,
    memberName: d.memberName ?? null,
    status: d.status,
    uploadedBy: "",
    uploadedAt: d.uploadedAt,
    contentType: null,
  }));
  const hasAny = requirements.length > 0 || documents.length > 0 || (onUpload && templates.length > 0);
  const showUpload = Boolean(onUpload && templates.length > 0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploadSheetTemplateId, setUploadSheetTemplateId] = useState<string | null>(null);

  const openUploadSheet = (templateId?: string | null) => {
    setUploadSheetTemplateId(templateId ?? null);
    setSheetOpen(true);
  };

  if (!hasAny && !isLoadingDocuments) {
    return (
      <div className="space-y-6">
        {showUpload && (
          <Section title="Upload document">
            <Button variant="outline" size="sm" onClick={() => openUploadSheet(null)}>
              <FileUp className="mr-2 size-4" />
              Upload document
            </Button>
            <DocumentUploadSheet
              templates={templates}
              members={members}
              onUpload={async (templateId, file, memberId) => (onUpload ? await onUpload(templateId, file, memberId) : false)}
              isUploading={isUploading}
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              defaultTemplateId={uploadSheetTemplateId}
            />
          </Section>
        )}
        <EmptyState
          icon={<FileQuestion className="size-10" />}
          title="No documents"
          description="Required documents and uploads will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showUpload && (
        <Section
          title="Upload document"
          action={
            <>
              <Button variant="outline" size="sm" onClick={() => openUploadSheet(null)}>
                <FileUp className="mr-2 size-4" />
                Upload document
              </Button>
              <DocumentUploadSheet
                templates={templates}
                members={members}
                defaultTemplateId={uploadSheetTemplateId}
                onUpload={async (templateId, file, memberId) => (onUpload ? await onUpload(templateId, file, memberId) : false)}
                isUploading={isUploading}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
              />
            </>
          }
        />
      )}

      <MissingDocumentsSection
        requirements={requirements}
        renderUploadTrigger={
          showUpload ? (r) => (
            <Button variant="outline" size="sm" onClick={() => openUploadSheet(r.templateId)}>
              Upload
            </Button>
          ) : undefined
        }
      />

      {requirements.length > 0 && (
        <Section title="Required documents">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {requirements.map((r) => (
                  <li key={r.requirementId} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.templateName}</p>
                      {r.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(r.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <DocumentStatusChip status={r.status} label={r.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      )}

      {documents.length > 0 && (
        <Section title="Upload history">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {documents.map((d) => (
                  <li key={d.documentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{d.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.templateName}
                        {d.memberName ? ` · ${d.memberName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.uploadedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDownload && d.storagePath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(d.storagePath)}
                          className="shrink-0"
                        >
                          <Download className="size-4" />
                        </Button>
                      )}
                      {onStatusChange ? (
                        <Select
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                          value={d.status}
                          onChange={(e) =>
                            onStatusChange(d.documentId, e.target.value as "pending" | "approved" | "rejected")
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        <DocumentStatusChip
                          status={d.status === "approved" ? "approved" : d.status === "rejected" ? "rejected" : "uploaded"}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>
      )}

      {isLoadingDocuments && (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      )}
    </div>
  );
}
