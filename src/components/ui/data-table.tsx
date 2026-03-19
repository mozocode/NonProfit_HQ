"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

function DataTableInner<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data",
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const getValue = (row: T, col: DataTableColumn<T>): unknown => {
    if (col.cell) return null;
    const key = col.accessorKey as keyof T;
    if (key == null) return null;
    return (row as Record<string, unknown>)[key as string];
  };

  if (isLoading) {
    return (
      <div className={cn("flex min-h-[120px] items-center justify-center", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[120px] items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8 text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-auto rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={keyExtractor(row)}>
              {columns.map((col) => (
                <TableCell key={col.id} className={col.className}>
                  {col.cell ? col.cell(row) : (getValue(row, col) as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DataTable<T>(props: DataTableProps<T>) {
  return <DataTableInner {...props} />;
}
