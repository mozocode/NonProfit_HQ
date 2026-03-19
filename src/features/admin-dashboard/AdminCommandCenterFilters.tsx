"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CommandCenterDateRange, CommandCenterFilters } from "@/types/commandCenter";
import { EMPTY_COMMAND_CENTER_FILTERS } from "@/types/commandCenter";
import { defaultCommandCenterRange } from "@/hooks/useAdminCommandCenter";

export interface AdminCommandCenterFiltersProps {
  range: CommandCenterDateRange;
  onRangeChange: (r: CommandCenterDateRange) => void;
  filters: CommandCenterFilters;
  onFiltersChange: (f: CommandCenterFilters) => void;
  schools: { id: string; label: string }[];
  partners: { id: string; label: string }[];
  programs: { id: string; label: string }[];
  optionsLoading?: boolean;
}

export function AdminCommandCenterFilters({
  range,
  onRangeChange,
  filters,
  onFiltersChange,
  schools,
  partners,
  programs,
  optionsLoading,
}: AdminCommandCenterFiltersProps) {
  const schoolOptions = [{ value: "", label: "All schools" }, ...schools.map((s) => ({ value: s.id, label: s.label }))];
  const partnerOptions = [
    { value: "", label: "All partners" },
    ...partners.map((p) => ({ value: p.id, label: p.label })),
  ];
  const programOptions = [
    { value: "", label: "All programs" },
    ...programs.map((p) => ({ value: p.id, label: p.label })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>
          Overview counts respect school / partner / program (same rules as reporting link windows). Activity feed uses the
          date range. {optionsLoading ? "Loading options…" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cc-start">Start date</Label>
          <input
            id="cc-start"
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={range.start}
            onChange={(e) => onRangeChange({ ...range, start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-end">End date</Label>
          <input
            id="cc-end"
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={range.end}
            onChange={(e) => onRangeChange({ ...range, end: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-school">School</Label>
          <Select
            id="cc-school"
            options={schoolOptions}
            value={filters.schoolId ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, schoolId: e.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-partner">Partner organization</Label>
          <Select
            id="cc-partner"
            options={partnerOptions}
            value={filters.partnerOrgId ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, partnerOrgId: e.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-program">Program</Label>
          <Select
            id="cc-program"
            options={programOptions}
            value={filters.programId ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, programId: e.target.value || null })}
          />
        </div>
        <div className="flex items-end md:col-span-2 xl:col-span-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onRangeChange(defaultCommandCenterRange(30));
              onFiltersChange({ ...EMPTY_COMMAND_CENTER_FILTERS });
            }}
          >
            Reset filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
