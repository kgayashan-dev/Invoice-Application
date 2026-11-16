"use client";
// Provides the reusable app card interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface AppCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  children?: React.ReactNode;
}

// Renders the app card interface and coordinates its data and user interactions.
export function AppCard({
  title,
  subtitle,
  actions,
  headerClassName,
  bodyClassName,
  footer,
  footerClassName,
  className,
  children,
  ...props
}: AppCardProps) {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            "px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50",
            headerClassName
          )}
        >
          <div className="min-w-0">
            {title && (
              <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>
      )}

      {children && (
        <div className={cn("p-3", bodyClassName)}>
          {children}
        </div>
      )}

      {footer && (
        <div
          className={cn(
            "px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-xs",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export default AppCard;
