"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useAdminDocumentTemplatesManage } from "@/hooks/useAdminTools";
import type { RequiredTemplateView } from "@/types/documents";

export function AdminDocumentTemplatesToolView() {
  const { templates, isLoading, error, refetch, create, update } = useAdminDocumentTemplatesManage();
  const [form, setForm] = useState({ name: "", documentType: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_TOOLS}>
          Admin tools
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Required document templates</CardTitle>
          <CardDescription>Define types staff and families see for uploads and compliance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Document type key</Label>
            <Input
              value={form.documentType}
              onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
              placeholder="e.g. id_verification"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              disabled={busy || !form.name.trim() || !form.documentType.trim()}
              onClick={() => {
                setBusy(true);
                void create({
                  name: form.name,
                  documentType: form.documentType,
                  description: form.description || null,
                })
                  .then(() => {
                    setForm({ name: "", documentType: "", description: "" });
                    setNote("Template created.");
                  })
                  .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                  .finally(() => setBusy(false));
              }}
            >
              Add template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Existing templates</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState message="Loading…" /> : null}
          {!isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TemplateRow key={t.templateId} template={t} onSave={update} />
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateRow({
  template: t,
  onSave,
}: {
  template: RequiredTemplateView;
  onSave: (id: string, patch: Partial<{ name: string; documentType: string; description: string | null }>) => Promise<void>;
}) {
  const [name, setName] = useState(t.name);
  const [documentType, setDocumentType] = useState(t.documentType);
  const [description, setDescription] = useState(t.description ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="font-mono text-xs" />
      </TableCell>
      <TableCell>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void onSave(t.templateId, { name, documentType, description: description || null }).finally(() => setSaving(false));
          }}
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}
