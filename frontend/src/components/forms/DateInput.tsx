"use client";
// Provides the reusable date input interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface DateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={props.type || "date"}
        className={cn(
          "w-full h-8 px-2.5 text-xs bg-white text-slate-800 border rounded-md outline-none transition-colors",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
DateInput.displayName = "DateInput";

export default DateInput;
