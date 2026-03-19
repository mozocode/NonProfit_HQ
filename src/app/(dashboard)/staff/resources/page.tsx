"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ResourceDirectoryCard } from "@/features/resources/ResourceDirectoryCard";
import { useResources } from "@/hooks/useResources";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export default function StaffResourcesPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const filters = useMemo(
    () => ({ categoryId: categoryId || undefined, search: search.trim() || undefined }),
    [categoryId, search],
  );
  const { resources, categories, isLoading, error, refetch } = useResources(filters);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({ value: c.categoryId, label: c.name })),
    ],
    [categories],
  );

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource directory"
        description="Search and filter providers. Assign resources to families from the family profile."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
            Back to dashboard
          </Link>
        }
      />

      <Section title="Search & filter" description="Find resources by name, business, or category.">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <Input
              id="search"
              type="search"
              placeholder="Search by name, business, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Label htmlFor="category" className="sr-only">Category</Label>
            <Select
              id="category"
              options={categoryOptions}
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
            />
          </div>
        </div>
      </Section>

      <Section title="Resources" description="Assign from a family profile via the Resources tab.">
        {isLoading ? (
          <LoadingState message="Loading resources…" />
        ) : resources.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="size-10" />}
            title="No resources"
            description="Add resources in admin settings or seed data. Staff can assign resources from a family profile."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <li key={r.resourceId}>
                <ResourceDirectoryCard resource={r} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
