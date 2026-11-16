"use client";

import React, { useState } from "react";
import {
  Printer,
  X,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  PenTool,
} from "lucide-react";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/utils/currency";
import { StatusBadge } from "@/components/feedback/StatusBadge";

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSign?: (invoiceId: number, signatureData: string) => Promise<void>;
  userRole?: string;
  userFullName?: string;
  userName?: string;
  companyName?: string;
  companyEmail?: string;
}

export default function InvoicePrintModal({
  invoice,
  isOpen,
  onClose,
  onSign,
  userRole = "",
  userFullName = "",
  userName = "",
  companyName = "Invoice Application Enterprise",
  companyEmail = "billing@invoiceapp.com",
}: InvoicePrintModalProps) {
  const [signatureName, setSignatureName] = useState(userFullName || userName || "Billing Officer");
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  if (!isOpen || !invoice) return null;

  const isBillingOfficer =
    userRole.toLowerCase().includes("billing") ||
    userRole.toLowerCase().includes("administrator") ||
    userRole.toLowerCase() === "admin";

  const isSigned = Boolean(invoice.signedBy || invoice.signedAt);

  const handleSign = async () => {
    if (!onSign || !invoice.id) return;
    if (!agreed) {
      alert("Please confirm the verification checkbox to sign.");
      return;
    }
    setIsSigning(true);
    try {
      const sigData = `${signatureName.trim()} (Electronic Signature - Certified)`;
      await onSign(invoice.id, sigData);
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currencyCode = invoice.currency || "LKR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-tight">
              Invoice #{invoice.invoiceNumber} — Document & Signature View
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="invoice-printable-content" className="p-6 sm:p-8 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  IE
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {companyName}
                  </h2>
                  <p className="text-[11px] text-slate-500">{companyEmail}</p>
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600">
                Official Tax Invoice
              </span>
              <h1 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {invoice.invoiceNumber}
              </h1>
              <div className="mt-1">
                <StatusBadge status={invoice.status} label={invoice.status} size="md" />
              </div>
            </div>
          </div>

          {/* Meta & Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                Billed To:
              </span>
              <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
              <p className="text-slate-500">{invoice.customerEmail || "No email provided"}</p>
            </div>

            <div className="sm:text-right">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                Invoice Details:
              </span>
              <p className="text-slate-600">
                <span className="text-slate-400">Issue Date:</span>{" "}
                <span className="font-mono font-medium">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </span>
              </p>
              <p className="text-slate-600">
                <span className="text-slate-400">Due Date:</span>{" "}
                <span className="font-mono font-medium text-rose-600">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </p>
              <p className="text-slate-600">
                <span className="text-slate-400">Billing Currency:</span>{" "}
                <span className="font-mono font-bold text-slate-900">{currencyCode}</span>
              </p>
            </div>
          </div>

          {/* Finance Review Notes Box */}
          {invoice.financeReviewNotes && (
            <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px] mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Finance Review & Instruction Note:</span>
              </div>
              <p className="text-amber-900 text-[11px] italic leading-relaxed">
                "{invoice.financeReviewNotes}"
              </p>
            </div>
          )}

          {/* Items Table */}
          <div className="my-4 border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">
                        {it.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatCurrency(it.unitPrice, currencyCode)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(it.amount ?? it.quantity * it.unitPrice, currencyCode)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 font-sans">
                      Standard Professional Billing Services
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-2 pb-4">
            <div className="w-full sm:w-64 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">
                  {formatCurrency(invoice.totalAmount, currencyCode)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax / VAT (0%):</span>
                <span className="font-mono font-medium">
                  {formatCurrency(0, currencyCode)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600 text-base">
                  {formatCurrency(invoice.totalAmount, currencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Official Sign-off & Electronic Stamp Section */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {isSigned ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Certified & Authorized Sign-off
                    </span>
                    <div className="font-serif italic text-base font-bold text-slate-900 mt-0.5">
                      {invoice.signedBy}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Authorized Billing Officer • {invoice.signedAt ? new Date(invoice.signedAt).toLocaleString() : "Verified"}
                    </p>
                    {invoice.signatureData && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {invoice.signatureData}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded text-center shrink-0 shadow-2xs">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                    DOCUMENT STATUS
                  </div>
                  <div className="text-xs font-extrabold font-mono tracking-tight text-emerald-900">
                    DIGITALLY SIGNED
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-amber-800">
                  <PenTool className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Billing Officer Electronic Sign-off
                  </span>
                </div>

                {isBillingOfficer ? (
                  <div className="space-y-3 print:hidden">
                    <p className="text-xs text-slate-600">
                      As an authorized Billing Officer, affix your official electronic signature to approve this invoice for distribution.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Your full signatory name"
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        I certify and verify that the billing line items are accurate and authorize this invoice.
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!agreed || isSigning}
                      onClick={handleSign}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>{isSigning ? "Signing..." : "Sign & Authorize Invoice"}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-900 italic">
                    Awaiting digital signature from an authorized Billing Officer before final distribution.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Thank you for your business. For billing inquiries, contact {companyEmail}.</p>
            <p className="mt-0.5 font-mono">Invoice System • Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
