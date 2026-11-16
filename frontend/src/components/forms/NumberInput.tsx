"use client";
// Provides the reusable number input interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        className={cn(
          "w-full h-8 px-2.5 text-xs bg-white text-slate-800 border rounded-md outline-none transition-colors placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
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
NumberInput.displayName = "NumberInput";

export default NumberInput;
