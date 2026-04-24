"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { createDocumentationPack, listDocumentationPacks } from "@/services/firestore/tenantAdminService";
import type { DocumentationPackView } from "@/types/tenantAdmin";

export function TenantTemplatesView() {
  const { orgId, user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [packs, setPacks] = useState<DocumentationPackView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setError(null);
    try {
      setPacks(await listDocumentationPacks(orgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates.");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation Templates</CardTitle>
        <CardDescription>Create reusable packs for intake, notes, compliance, and billing evidence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="pack-name">Pack name</Label>
            <Input id="pack-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pack-description">Description</Label>
            <Input id="pack-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={isSaving || !name.trim() || !orgId || !user}
              onClick={() => {
                if (!orgId || !user) return;
                setIsSaving(true);
                void createDocumentationPack(orgId, {
                  name,
                  description,
                  includeIntake: true,
                  includeEnrollment: true,
                  includeAssessment: true,
                  includeCaseNoteTemplate: true,
                  includeSignatureStep: true,
                  createdByUid: user.uid,
                })
                  .then(async () => {
                    setName("");
                    setDescription("");
                    await load();
                  })
                  .catch((e) => setError(e instanceof Error ? e.message : "Failed to create template."))
                  .finally(() => setIsSaving(false));
              }}
            >
              {isSaving ? "Saving..." : "Create template pack"}
            </Button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs.map((pack) => (
              <TableRow key={pack.packId}>
                <TableCell>{pack.name}</TableCell>
                <TableCell>{pack.description || "—"}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {[
                    pack.includeIntake ? "Intake" : null,
                    pack.includeEnrollment ? "Enrollment" : null,
                    pack.includeAssessment ? "Assessment" : null,
                    pack.includeCaseNoteTemplate ? "Case note" : null,
                    pack.includeSignatureStep ? "Signature" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </TableCell>
              </TableRow>
            ))}
            {packs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-slate-500">
                  No template packs yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
