"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  description,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const desc = description || hint;

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-slate-700 flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {children}

      {desc && !error && (
        <span className="text-[11px] text-slate-500 leading-tight">
          {desc}
        </span>
      )}

      {error && (
        <span className="text-[11px] font-medium text-rose-600 leading-tight" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default FormField;
