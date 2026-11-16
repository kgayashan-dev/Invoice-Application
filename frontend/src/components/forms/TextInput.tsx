"use client";
// Provides the reusable text input interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={cn(
          "w-full h-8 px-2.5 text-xs bg-white text-slate-800 border rounded-md outline-none transition-colors placeholder:text-slate-400",
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
TextInput.displayName = "TextInput";

export default TextInput;
