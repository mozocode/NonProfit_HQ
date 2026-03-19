"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useAdminResourceDirectoryManage } from "@/hooks/useAdminTools";
import type { AdminUpsertResourceInput } from "@/services/firestore/resourcesService";
import type { ResourceView } from "@/types/resources";

export function AdminResourcesToolView() {
  const { categories, resources, isLoading, error, refetch, addCategory, addResource, patchResource } =
    useAdminResourceDirectoryManage();
  const [catName, setCatName] = useState("");
  const [newRes, setNewRes] = useState({ name: "", categoryId: "", providerName: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const catOptions = [
    { value: "", label: "— None —" },
    ...categories.map((c) => ({ value: c.categoryId, label: c.name })),
  ];

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
          <CardTitle>Categories</CardTitle>
          <CardDescription>Group resources for the staff directory and referrals.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label>New category name</Label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Basic needs" />
          </div>
          <Button
            type="button"
            disabled={busy || !catName.trim()}
            onClick={() => {
              setBusy(true);
              void addCategory(catName)
                .then(() => {
                  setCatName("");
                  setNote("Category created.");
                })
                .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                .finally(() => setBusy(false));
            }}
          >
            Add category
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add resource</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={newRes.name} onChange={(e) => setNewRes((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select options={catOptions} value={newRes.categoryId} onChange={(e) => setNewRes((s) => ({ ...s, categoryId: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input
              value={newRes.providerName}
              onChange={(e) => setNewRes((s) => ({ ...s, providerName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={newRes.phone} onChange={(e) => setNewRes((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              disabled={busy || !newRes.name.trim()}
              onClick={() => {
                setBusy(true);
                void addResource({
                  name: newRes.name,
                  categoryId: newRes.categoryId || null,
                  providerName: newRes.providerName || null,
                  phone: newRes.phone || null,
                })
                  .then(() => {
                    setNewRes({ name: "", categoryId: "", providerName: "", phone: "" });
                    setNote("Resource created.");
                  })
                  .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                  .finally(() => setBusy(false));
              }}
            >
              Create resource
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Edit listing; changes apply to new referrals immediately.</CardDescription>
          </div>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <ResourceRow key={r.resourceId} resource={r} catOptions={catOptions} onSave={patchResource} />
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ResourceRow({
  resource: r,
  catOptions,
  onSave,
}: {
  resource: ResourceView;
  catOptions: { value: string; label: string }[];
  onSave: (id: string, patch: Partial<AdminUpsertResourceInput>) => Promise<void>;
}) {
  const [name, setName] = useState(r.name);
  const [categoryId, setCategoryId] = useState(r.categoryId ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-[220px]" />
      </TableCell>
      <TableCell>
        <Select options={catOptions} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-[140px]" />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void onSave(r.resourceId, { name, categoryId: categoryId || null, phone: phone || null })
              .finally(() => setSaving(false));
          }}
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}
