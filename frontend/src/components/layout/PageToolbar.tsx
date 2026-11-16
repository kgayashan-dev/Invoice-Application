"use client";
// Provides the reusable page toolbar interface used across the frontend.

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  count?: number | { current: number; total: number };
  countLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

// Renders the page toolbar interface and coordinates its data and user interactions.
export function PageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  count,
  countLabel = "records",
  className,
  children,
}: PageToolbarProps) {
  const showSearch = onSearchChange !== undefined;

  let countText = "";
  if (typeof count === "number") {
    countText = `${count} ${countLabel}`;
  } else if (count && typeof count === "object") {
    countText = `${count.current} of ${count.total} ${countLabel}`;
  }

  return (
    <div
      className={cn(
        "bg-white px-2.5 py-2 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs",
        className
      )}
    >
      {/* Left side: Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
        {showSearch && (
          <div className="relative flex-1 sm:max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {filters}
        {children}
      </div>

      {/* Right side: Count and Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {countText && (
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline px-1">
            {countText}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}

export default PageToolbar;
