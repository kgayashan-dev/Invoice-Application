"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import TableSkeleton from "./TableSkeleton";
import EmptyState from "../feedback/EmptyState";

export interface ColumnDef<T> {
  key?: string;
  header: React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey?: ((row: T, index: number) => string | number) | string;
  keyField?: string;
  isLoading?: boolean;
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  containerClassName?: string;
  className?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  keyField,
  isLoading,
  loading,
  skeletonRows = 5,
  emptyState,
  emptyMessage,
  emptyTitle = "No records found",
  emptyDescription = "There are no matching items to display.",
  sortField: externalSortField,
  sortDirection: externalSortDir,
  onSort: externalOnSort,
  onRowClick,
  stickyHeader = false,
  containerClassName,
  className,
}: DataTableProps<T>) {
  const isTableLoading = Boolean(isLoading ?? loading);

  const [internalSortField, setInternalSortField] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc">("asc");

  const currentSortField = externalSortField ?? internalSortField;
  const currentSortDir = externalSortDir ?? internalSortDir;

  const handleSort = (fieldKey: string) => {
    if (externalOnSort) {
      externalOnSort(fieldKey);
      return;
    }
    if (internalSortField === fieldKey) {
      setInternalSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setInternalSortField(fieldKey);
      setInternalSortDir("asc");
    }
  };

  const getRowKey = (row: T, idx: number): string | number => {
    if (typeof rowKey === "function") return rowKey(row, idx);
    if (typeof rowKey === "string") return (row as Record<string, unknown>)[rowKey] as string | number;
    if (keyField) return (row as Record<string, unknown>)[keyField] as string | number;
    return idx;
  };

  if (isTableLoading) {
    return <TableSkeleton columns={columns.length} rows={skeletonRows} />;
  }

  if (!data || data.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <EmptyState
        title={emptyMessage || emptyTitle}
        description={emptyMessage ? "" : emptyDescription}
        className="py-12"
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg bg-white",
        containerClassName
      )}
    >
      <table className={cn("w-full text-left text-xs text-slate-700 border-collapse", className)}>
        <thead
          className={cn(
            "bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 select-none",
            stickyHeader && "sticky top-0 z-10 backdrop-blur-xs"
          )}
        >
          <tr>
            {columns.map((col, idx) => {
              const alignClass =
                col.align === "center"
                  ? "text-center"
                  : col.align === "right"
                  ? "text-right"
                  : "text-left";
              const colKey = col.key ?? String(idx);
              const isSorted = currentSortField === colKey;

              return (
                <th
                  key={colKey}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-3 py-2.5 font-semibold",
                    alignClass,
                    col.sortable && "cursor-pointer hover:bg-slate-100/70 transition-colors",
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(colKey) : undefined}
                >
                  <div
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "justify-end w-full",
                      col.align === "center" && "justify-center w-full"
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {isSorted ? (
                          currentSortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => {
            const k = getRowKey(row, rowIdx);
            return (
              <tr
                key={k}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "hover:bg-slate-50/70 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, colIdx) => {
                  const alignClass =
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left";

                  const cellValue = col.cell
                    ? col.cell(row, rowIdx)
                    : col.render
                    ? col.render(row, rowIdx)
                    : col.key
                    ? (row as Record<string, unknown>)[col.key]
                    : null;

                  return (
                    <td
                      key={col.key ?? colIdx}
                      className={cn("px-3 py-2 text-slate-700", alignClass, col.className)}
                    >
                      {cellValue as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
