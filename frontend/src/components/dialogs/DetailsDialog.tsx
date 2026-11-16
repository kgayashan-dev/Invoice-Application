"use client";
// Provides the reusable details dialog interface used across the frontend.

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  closeLabel?: string;
  maxWidth?: string;
  actions?: React.ReactNode;
}

// Renders the details dialog interface and coordinates its data and user interactions.
export function DetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  closeLabel = "Close",
  maxWidth = "max-w-lg",
  actions,
}: DetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-4 sm:p-5 gap-0", maxWidth)}>
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-sm font-semibold text-slate-800">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-3 max-h-[72vh] overflow-y-auto px-0.5 custom-scrollbar text-xs">
          {children}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
          {actions}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DetailsDialog;
