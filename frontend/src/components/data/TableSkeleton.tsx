"use client";
// Provides the reusable table skeleton interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface TableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

// Renders the table skeleton interface and coordinates its data and user interactions.
export function TableSkeleton({
  columns,
  rows = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full overflow-hidden animate-pulse", className)}>
      <div className="space-y-2 p-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={`skel-row-${rIdx}`}
            className="flex items-center gap-3 py-2 border-b border-slate-100"
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={`skel-cell-${rIdx}-${cIdx}`}
                className="h-3.5 bg-slate-200 rounded flex-1"
                style={{
                  maxWidth: cIdx === 0 ? "80px" : cIdx === columns - 1 ? "90px" : "100%",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;
