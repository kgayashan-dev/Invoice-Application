"use client";
// Provides the reusable text area interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full px-2.5 py-1.5 text-xs bg-white text-slate-800 border rounded-md outline-none transition-colors placeholder:text-slate-400 resize-y",
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
TextArea.displayName = "TextArea";

export default TextArea;
