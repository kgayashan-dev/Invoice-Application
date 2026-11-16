"use client";

import React from "react";
import { RefreshCw, PanelLeftClose, PanelLeft } from "lucide-react";
import { useSidebar } from "@/Contexts/SidebarContext";

export interface DarkPageHeaderProps {
  icon?: React.ReactNode;
  breadcrumbs: string[];
  pageTitle: string;
  description?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export default function DarkPageHeader({
  icon,
  breadcrumbs,
  pageTitle,
  description,
  onRefresh,
  isRefreshing = false,
  actions,
  className = "",
}: DarkPageHeaderProps) {
  const { isSidebarHidden, toggleSidebar } = useSidebar();

  return (
    <header
      className={`bg-[#1e293b] text-white px-3 py-2 rounded-lg flex items-center justify-between shadow-xs border border-slate-800/80 transition-all ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2 text-xs">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-md transition-colors"
          title={isSidebarHidden ? "Show Sidebar" : "Hide Sidebar"}
        >
          {isSidebarHidden ? <PanelLeft className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {icon && <div className="text-cyan-400 shrink-0">{icon}</div>}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-600">/</span>}
                <span className={i === breadcrumbs.length - 1 ? "text-cyan-300 font-semibold" : ""}>
                  {b}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight leading-none mt-0.5">
              {pageTitle}
            </h1>
            {description && (
              <span className="hidden md:inline text-[11px] text-slate-400 font-normal truncate">
                • {description}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-md transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}
