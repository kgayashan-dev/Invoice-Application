"use client";
// Provides the reusable pagination interface used across the frontend.

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

// Renders the pagination interface and coordinates its data and user interactions.
export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Calculate record range
  let recordRangeText = "";
  if (totalRecords !== undefined) {
    const start = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const end = Math.min(safeCurrentPage * pageSize, totalRecords);
    recordRangeText = `Showing ${start} to ${end} of ${totalRecords} entries`;
  } else {
    recordRangeText = `Page ${safeCurrentPage} of ${safeTotalPages}`;
  }

  // Calculate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safeCurrentPage < safeTotalPages - 2) pages.push("...");
      pages.push(safeTotalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600",
        className
      )}
    >
      {/* Left: Record count and page size selector */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-[11px] text-slate-500">{recordRangeText}</span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 text-[11px] bg-white border border-slate-200 rounded px-1.5 outline-none focus:border-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={`pagesize-${opt}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "h-7 min-w-[28px] px-1.5 text-[11px] font-medium rounded transition-colors",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:bg-slate-200/70"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
