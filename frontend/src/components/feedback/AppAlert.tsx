"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AppAlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  message?: React.ReactNode;
  children?: React.ReactNode;
  onDismiss?: () => void;
  onClose?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; iconComponent: React.ComponentType<{ className?: string }> }
> = {
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-900",
    icon: "text-emerald-600",
    iconComponent: CheckCircle2,
  },
  error: {
    container: "bg-rose-50 border-rose-200 text-rose-900",
    icon: "text-rose-600",
    iconComponent: AlertCircle,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-900",
    icon: "text-amber-600",
    iconComponent: AlertTriangle,
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-900",
    icon: "text-blue-600",
    iconComponent: Info,
  },
};

export function AppAlert({
  variant = "info",
  title,
  message,
  children,
  onDismiss,
  onClose,
  onRetry,
  retryLabel = "Retry",
  className,
}: AppAlertProps) {
  const styles = variantStyles[variant];
  const Icon = styles.iconComponent;
  const content = children ?? message;
  const handleDismiss = onDismiss ?? onClose;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-2.5 sm:p-3 text-xs flex items-start gap-2.5 transition-all shadow-2xs",
        styles.container,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", styles.icon)} />

      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold text-xs mb-0.5 leading-snug">{title}</div>}
        {content && <div className="text-[11px] sm:text-xs leading-relaxed">{content}</div>}
      </div>

      <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-0.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded hover:bg-black/5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{retryLabel}</span>
          </button>
        )}

        {handleDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="p-1 rounded text-current opacity-60 hover:opacity-100 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AppAlert;
