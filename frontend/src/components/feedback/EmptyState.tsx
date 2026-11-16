"use client";
// Provides the reusable empty state interface used across the frontend.

import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  minHeight?: string;
  className?: string;
}

// Renders the empty state interface and coordinates its data and user interactions.
export function EmptyState({
  icon,
  title = "No records found",
  description,
  action,
  minHeight = "min-h-[180px]",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200",
        minHeight,
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h4 className="text-xs font-semibold text-slate-800">{title}</h4>
      {description && (
        <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-normal">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

export default EmptyState;
