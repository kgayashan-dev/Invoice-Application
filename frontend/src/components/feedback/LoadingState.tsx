"use client";
// Provides the reusable loading state interface used across the frontend.

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  minHeight?: string;
  className?: string;
}

// Renders the loading state interface and coordinates its data and user interactions.
export function LoadingState({
  label = "Loading...",
  minHeight = "min-h-[200px]",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 p-6 text-slate-500",
        minHeight,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

export default LoadingState;
