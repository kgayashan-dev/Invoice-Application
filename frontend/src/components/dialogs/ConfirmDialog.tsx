"use client";

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
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "danger" | "warning" | "primary";

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  maxWidth?: string;
}

export function ConfirmDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  maxWidth = "max-w-md",
}: ConfirmDialogProps) {
  const isDialogActive = Boolean(open ?? isOpen);

  const handleOpenChange = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    if (!val && onClose) onClose();
  };

  let icon = <AlertCircle className="w-5 h-5 text-rose-600" />;
  let confirmBtnClass = "bg-rose-600 hover:bg-rose-700 text-white";

  if (variant === "warning") {
    icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
    confirmBtnClass = "bg-amber-600 hover:bg-amber-700 text-white";
  } else if (variant === "primary") {
    icon = <Info className="w-5 h-5 text-blue-600" />;
    confirmBtnClass = "bg-blue-600 hover:bg-blue-700 text-white";
  }

  return (
    <Dialog open={isDialogActive} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("p-0 overflow-hidden", maxWidth)}>
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-full bg-slate-100 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-sm font-bold text-slate-900">{title}</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                  {message}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("text-xs font-semibold shadow-xs cursor-pointer", confirmBtnClass)}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <span>{confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
