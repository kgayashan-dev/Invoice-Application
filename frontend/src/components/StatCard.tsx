"use client";
// Provides the reusable stat card interface used across the frontend.

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red";
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-600" },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600",  text: "text-green-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-600" },
  amber:  { bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  text: "text-amber-600" },
  red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-600",      text: "text-red-600" },
};

// Renders the stat card interface and coordinates its data and user interactions.
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = "blue",
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>

      <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>

      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            >
              {trend === "up"   ? <TrendingUp className="w-3 h-3" />   :
               trend === "down" ? <TrendingDown className="w-3 h-3" /> :
                                  <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
