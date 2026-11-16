import React from "react";

interface StatusBadgeProps {
  status: string | boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusBadge({ status, activeLabel = "Active", inactiveLabel = "Inactive" }: StatusBadgeProps) {
  const isBoolean = typeof status === "boolean";
  const isActive = isBoolean ? status : status?.toLowerCase() === "active" || status?.toLowerCase() === "paid";
  const isLocked = status === "Locked" || status === true; // or locked boolean

  let colorClasses = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (isBoolean) {
    colorClasses = status
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}>
        {status ? activeLabel : inactiveLabel}
      </span>
    );
  }

  const s = String(status).toUpperCase();
  if (s === "ACTIVE" || s === "PAID" || s === "HEALTHY") {
    colorClasses = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
  } else if (s === "PENDING" || s === "DRAFT") {
    colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
  } else if (s === "LOCKED" || s === "CANCELLED" || s === "OVERDUE" || s === "INACTIVE") {
    colorClasses = "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}>
      {status}
    </span>
  );
}
