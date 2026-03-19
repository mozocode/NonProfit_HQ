"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ResourceDirectoryCard } from "@/features/resources/ResourceDirectoryCard";
import type { ResourceView } from "@/types/resources";
import { Loader2 } from "lucide-react";

export interface AssignResourceSheetProps {
  familyId: string;
  resources: ResourceView[];
  isLoadingResources: boolean;
  onAssign: (resourceId: string) => Promise<void>;
  isSubmitting: boolean;
  trigger?: React.ReactNode;
}

export function AssignResourceSheet({
  familyId,
  resources,
  isLoadingResources,
  onAssign,
  isSubmitting,
  trigger,
}: AssignResourceSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const filtered = search.trim()
    ? resources.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.providerName?.toLowerCase().includes(search.toLowerCase()) ||
          r.businessName?.toLowerCase().includes(search.toLowerCase()) ||
          r.categoryName?.toLowerCase().includes(search.toLowerCase()),
      )
    : resources;

  const handleAssign = async (resourceId: string) => {
    setAssigningId(resourceId);
    try {
      await onAssign(resourceId);
      setOpen(false);
      setSearch("");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Assign resource
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Assign resource to family</SheetTitle>
          <SheetDescription>
            Search and select a resource to assign. It will appear on the family profile with status &quot;Suggested&quot;.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-hidden">
          <div>
            <Label htmlFor="resource-search" className="sr-only">Search resources</Label>
            <Input
              id="resource-search"
              type="search"
              placeholder="Search by name, business, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {isLoadingResources ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources match.</p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((r) => (
                  <li key={r.resourceId}>
                    <ResourceDirectoryCard
                      resource={r}
                      action={
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isSubmitting || assigningId !== null}
                          onClick={() => handleAssign(r.resourceId)}
                        >
                          {assigningId === r.resourceId ? "Assigning…" : "Assign"}
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
