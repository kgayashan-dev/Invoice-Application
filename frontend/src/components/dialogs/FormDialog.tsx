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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  preventOutsideDismiss?: boolean;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function FormDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  subtitle,
  children,
  onSubmit,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  maxWidth = "max-w-lg",
  footer,
}: FormDialogProps) {
  const isDialogActive = Boolean(open ?? isOpen);

  const handleOpenChange = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    if (!val && onClose) onClose();
  };

  const dialogDesc = subtitle || description;

  const content = (
    <>
      <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
        <DialogTitle className="text-sm font-bold text-slate-900">{title}</DialogTitle>
        {dialogDesc && (
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {dialogDesc}
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="px-5 py-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {children}
      </div>

      {footer ? (
        <DialogFooter className="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
          {footer}
        </DialogFooter>
      ) : (
        <DialogFooter className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || submitDisabled}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <span>{submitLabel}</span>
          </Button>
        </DialogFooter>
      )}
    </>
  );

  return (
    <Dialog open={isDialogActive} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("p-0 overflow-hidden", maxWidth)}>
        {onSubmit ? (
          <form onSubmit={onSubmit} className="contents">
            {content}
          </form>
        ) : (
          content
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FormDialog;
