"use client";
// Provides the reusable page shell interface used across the frontend.

import React from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// Renders the page shell interface and coordinates its data and user interactions.
export function PageShell({ children, className, ...props }: PageShellProps) {
  return (
    <div
      className={cn("w-full flex flex-col gap-2 min-w-0 transition-all", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default PageShell;
