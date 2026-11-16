"use client";
// Provides the reusable status badge interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status?: string | boolean | null;
  label?: string;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

// Renders the status badge interface and coordinates its data and user interactions.
export function StatusBadge({
  status,
  label,
  dot = true,
  size = "sm",
  className,
}: StatusBadgeProps) {
  // Normalize status text
  let statusText = "";
  if (typeof status === "boolean") {
    statusText = status ? "Active" : "Inactive";
  } else if (typeof status === "string") {
    statusText = status.trim();
  } else if (status === null || status === undefined) {
    statusText = label || "Unknown";
  }

  const displayText = label || statusText || "Unknown";
  const lower = statusText.toLowerCase();

  // Color mapping
  let bg = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  if (
    lower === "active" ||
    lower === "approved" ||
    lower === "finalized" ||
    lower === "completed" ||
    lower === "paid" ||
    lower === "present" ||
    lower === "success" ||
    lower === "true" ||
    lower === "valid"
  ) {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    dotColor = "bg-emerald-500";
  } else if (
    lower === "pending" ||
    lower === "draft" ||
    lower === "in progress" ||
    lower === "processing" ||
    lower === "submitted" ||
    lower === "reviewing"
  ) {
    bg = "bg-amber-50 text-amber-700 border-amber-200/80";
    dotColor = "bg-amber-500";
  } else if (
    lower === "inactive" ||
    lower === "rejected" ||
    lower === "cancelled" ||
    lower === "canceled" ||
    lower === "suspended" ||
    lower === "disabled" ||
    lower === "absent" ||
    lower === "void" ||
    lower === "false" ||
    lower === "failed" ||
    lower === "error"
  ) {
    bg = "bg-rose-50 text-rose-700 border-rose-200/80";
    dotColor = "bg-rose-500";
  } else if (
    lower === "late" ||
    lower === "half-day" ||
    lower === "half day" ||
    lower === "partial" ||
    lower === "warning"
  ) {
    bg = "bg-orange-50 text-orange-700 border-orange-200/80";
    dotColor = "bg-orange-500";
  } else if (
    lower === "holiday" ||
    lower === "weekend" ||
    lower === "off" ||
    lower === "rest day" ||
    lower === "leave" ||
    lower === "on leave"
  ) {
    bg = "bg-blue-50 text-blue-700 border-blue-200/80";
    dotColor = "bg-blue-500";
  } else if (lower === "info" || lower === "open") {
    bg = "bg-sky-50 text-sky-700 border-sky-200/80";
    dotColor = "bg-sky-500";
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 leading-tight"
      : "text-xs px-2.5 py-1 leading-normal";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap transition-colors",
        bg,
        sizeClasses,
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}

export default StatusBadge;
