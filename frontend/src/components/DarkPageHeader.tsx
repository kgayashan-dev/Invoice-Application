import React from "react";

interface DarkPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function DarkPageHeader({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
}: DarkPageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium mb-2">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-500">/</span>}
                  <span>{b.label}</span>
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2.5 self-start sm:self-auto">{actions}</div>}
      </div>
    </div>
  );
}
