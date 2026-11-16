"use client";

import React, { useState } from "react";
import { Send, X, FileText, AlertCircle } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/utils/currency";

interface RequestSignatureModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: number, notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function RequestSignatureModal({
  invoice,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RequestSignatureModalProps) {
  const [notes, setNotes] = useState(
    "Please review, sign electronically, and generate the customer invoice PDF."
  );

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.id) return;
    await onSubmit(invoice.id, notes);
  };

  const currencyCode = invoice.currency || "LKR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-tight">
              Request Billing Officer Signature
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Invoice Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-mono font-bold text-slate-900">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-800">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="font-mono font-bold text-blue-600">
                {formatCurrency(invoice.totalAmount, currencyCode)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Instructions for Billing Officer:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add specific notes or instructions for the billing officer..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              required
            />
            <p className="text-[11px] text-slate-400">
              An immediate notification will be dispatched to the Billing Officer with your note.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Sending..." : "Send Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
