"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import type { RequiredTemplateView } from "@/types/documents";
import { FileUp, Loader2 } from "lucide-react";

const ACCEPT = "image/*,.pdf,application/pdf";
const MAX_SIZE_MB = 20;

export interface DocumentUploadSheetProps {
  templates: RequiredTemplateView[];
  members?: { memberId: string; name: string }[];
  onUpload: (templateId: string, file: File, memberId?: string | null) => Promise<boolean>;
  isUploading: boolean;
  trigger?: React.ReactNode;
  /** Pre-selected template (e.g. when uploading for a missing requirement). */
  defaultTemplateId?: string | null;
  /** Controlled open state; when set, trigger is not rendered (parent provides trigger(s)). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DocumentUploadSheet({
  templates,
  members = [],
  onUpload,
  isUploading,
  trigger,
  defaultTemplateId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DocumentUploadSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOnOpenChange != null;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;
  const [templateId, setTemplateId] = useState<string>(defaultTemplateId ?? "");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTemplateId(defaultTemplateId ?? "");
    setMemberId(null);
    setFile(null);
    setError(null);
  };

  useEffect(() => {
    if (open && defaultTemplateId) setTemplateId(defaultTemplateId);
  }, [open, defaultTemplateId]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    setError(null);
    if (!chosen) {
      setFile(null);
      return;
    }
    const sizeMB = chosen.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setError(`File must be under ${MAX_SIZE_MB} MB`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(chosen);
  };

  const handleSubmit = async () => {
    if (!templateId || !file) {
      setError("Select a document type and choose a file.");
      return;
    }
    setError(null);
    const ok = await onUpload(templateId, file, memberId ?? undefined);
    if (ok) {
      setOpen(false);
      reset();
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setError("Upload failed. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm">
              <FileUp className="mr-2 size-4" />
              Upload document
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upload document</SheetTitle>
          <SheetDescription>
            Upload an image or PDF. Supported: images, PDF (max {MAX_SIZE_MB} MB).
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-1 flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="doc-template">Document type</Label>
            <Select
              id="doc-template"
              options={[{ value: "", label: "Select type" }, ...templates.map((t) => ({ value: t.templateId, label: t.name }))]}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </div>
          {members.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="doc-member">Family member (optional)</Label>
              <Select
                id="doc-member"
                options={[
                  { value: "family", label: "Family-level" },
                  ...members.map((m) => ({ value: m.memberId, label: m.name })),
                ]}
                value={memberId ?? "family"}
                onChange={(e) => setMemberId(e.target.value === "family" ? null : e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doc-file">File</Label>
            <input
              ref={inputRef}
              id="doc-file"
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:transition-colors hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="mt-auto flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!templateId || !file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
