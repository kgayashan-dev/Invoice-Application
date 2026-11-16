"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  X,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  PenTool,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { Invoice } from "@/types/invoice";
import { AppAsset } from "@/types/asset";
import { formatCurrency, getCurrencyPrefix } from "@/utils/currency";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import {
  getAssets,
  downloadInvoicePdf,
  downloadInvoiceExcel,
} from "@/services/api";

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSign?: (invoiceId: number, signatureData: string, signatureId?: number) => Promise<void>;
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
  companyName = "FINNECT DIGITAL (PVT) LTD",
  companyEmail = "Inf@finnectdigital.lk",
}: InvoicePrintModalProps) {
  const [signatureName, setSignatureName] = useState(userFullName || userName || "Billing Officer");
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Asset selection
  const [logos, setLogos] = useState<AppAsset[]>([]);
  const [signatures, setSignatures] = useState<AppAsset[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<number | undefined>();
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | undefined>();

  useEffect(() => {
    if (isOpen) {
      getAssets("Logo").then((data) => {
        setLogos(data);
        if (invoice?.logoId) {
          setSelectedLogoId(invoice.logoId);
        } else {
          const def = data.find((a) => a.isDefault) || data[0];
          if (def) setSelectedLogoId(def.id);
        }
      }).catch(() => {});

      getAssets("Signature").then((data) => {
        setSignatures(data);
        if (invoice?.signatureId) {
          setSelectedSignatureId(invoice.signatureId);
        } else {
          const def = data.find((a) => a.isDefault) || data[0];
          if (def) setSelectedSignatureId(def.id);
        }
      }).catch(() => {});
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const isBillingOfficer =
    userRole.toLowerCase().includes("billing") ||
    userRole.toLowerCase().includes("administrator") ||
    userRole.toLowerCase() === "admin";

  const isSigned = Boolean(invoice.signedBy || invoice.signedAt);
  const currencyCode = invoice.currency || "LKR";
  const currencyPrefix = getCurrencyPrefix(currencyCode);

  const activeLogo = logos.find((l) => l.id === selectedLogoId) || logos.find((l) => l.isDefault) || logos[0];
  const activeSignature = signatures.find((s) => s.id === selectedSignatureId) || signatures.find((s) => s.isDefault) || signatures[0];

  const handleSign = async () => {
    if (!onSign || !invoice.id) return;
    if (!agreed) {
      alert("Please confirm the verification checkbox to sign.");
      return;
    }
    setIsSigning(true);
    try {
      const sigData = `${signatureName.trim()} (Electronic Signature - Certified)`;
      await onSign(invoice.id, sigData, selectedSignatureId);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice.id) return;
    setIsExportingPdf(true);
    try {
      await downloadInvoicePdf(
        invoice.id,
        { logoId: selectedLogoId, signatureId: selectedSignatureId },
        `${invoice.invoiceNumber}.pdf`
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error generating PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!invoice.id) return;
    setIsExportingExcel(true);
    try {
      await downloadInvoiceExcel(invoice.id, `${invoice.invoiceNumber}_Particulars.xlsx`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error generating Excel report.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const subtotal = invoice.subtotal || invoice.totalAmount;
  const tax = invoice.taxAmount || 0;
  const total = invoice.totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none">
        {/* Modal Controls - Clean & Compact */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold tracking-tight">
              Invoice #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Download PDF Document"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? "Generating..." : "PDF"}</span>
            </button>

            {/* Excel Download */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Export Excel particulars spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExportingExcel ? "Exporting..." : "Excel"}</span>
            </button>

            {/* Browser Print */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Print via Browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Branding & Asset Selectors Strip (Hidden during print) */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 text-[11px]">Logo:</span>
              <select
                value={selectedLogoId || ""}
                onChange={(e) => setSelectedLogoId(Number(e.target.value) || undefined)}
                className="px-2 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-800"
              >
                {logos.length === 0 ? (
                  <option value="">Default Logo</option>
                ) : (
                  logos.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.isDefault ? "(Default)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 text-[11px]">Signatory:</span>
              <select
                value={selectedSignatureId || ""}
                onChange={(e) => setSelectedSignatureId(Number(e.target.value) || undefined)}
                className="px-2 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-800"
              >
                {signatures.length === 0 ? (
                  <option value="">Default Signature</option>
                ) : (
                  signatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isDefault ? "(Default)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <span className="text-[10px] text-slate-400">
            Selected assets are embedded on generated PDF
          </span>
        </div>

        {/* Document Content - Compact & Clean */}
        <div id="invoice-printable-content" className="p-6 sm:p-8 text-slate-900 bg-white min-h-[550px]">
          {/* 1. Header: Company Info (Left) and Logo (Right) */}
          <div className="flex items-start justify-between gap-4 pb-3">
            <div className="space-y-0.5 text-[11px]">
              <h1 className="text-sm font-extrabold uppercase text-slate-900 tracking-tight">
                {invoice.bankAccountName || companyName}
              </h1>
              <p className="text-slate-600">
                Basil&apos;s building, 5th floor, 340, 1/5, Galle Road Colombo 03.
              </p>
              <p className="text-slate-600">
                Tel. +94 711951111 &nbsp; {companyEmail}
              </p>
              <p className="text-slate-600 font-medium">
                TIN No. 242770170
              </p>
            </div>

            {/* Logo container */}
            <div className="flex items-center justify-end">
              {activeLogo?.imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeLogo.imageData}
                  alt={activeLogo.name}
                  className="max-h-12 max-w-[140px] object-contain"
                />
              ) : (
                <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-black tracking-wider">
                  {companyName}
                </div>
              )}
            </div>
          </div>

          {/* 2. Centered INVOICE title */}
          <div className="py-3 text-center">
            <span className="text-xl font-extrabold uppercase tracking-widest text-[#2E64A8]">
              INVOICE
            </span>
          </div>

          {/* 3. Bill To (Left) & Invoice Meta (Right) */}
          <div className="grid grid-cols-12 gap-4 pb-4">
            {/* Bill To */}
            <div className="col-span-7 border border-[#2E64A8] rounded overflow-hidden">
              <div className="bg-[#2E64A8] text-white px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider">
                BILL TO
              </div>
              <div className="p-2.5 text-[11px] space-y-0.5">
                {invoice.attention && (
                  <p className="text-slate-700 font-medium">{invoice.attention}</p>
                )}
                <p className="font-bold text-xs text-slate-900">{invoice.customerName}</p>
                {invoice.customerAddress ? (
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {invoice.customerAddress}
                  </p>
                ) : (
                  <p className="text-slate-500">{invoice.customerEmail || "Colombo, Sri Lanka"}</p>
                )}
              </div>
            </div>

            {/* Meta Details Box */}
            <div className="col-span-5 border border-slate-300 rounded overflow-hidden text-[11px] divide-y divide-slate-200">
              <div className="flex justify-between px-2.5 py-1">
                <span className="font-semibold text-slate-500">DATE</span>
                <span className="font-bold text-slate-900">
                  {new Date(invoice.issueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between px-2.5 py-1">
                <span className="font-semibold text-slate-500">INVOICE No.</span>
                <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between px-2.5 py-1">
                <span className="font-semibold text-slate-500">CUSTOMER ID</span>
                <span className="font-medium text-slate-800">{invoice.customerId || "CDFF"}</span>
              </div>
              <div className="flex justify-between px-2.5 py-1">
                <span className="font-semibold text-slate-500">CUSTOMER TIN</span>
                <span className="font-medium text-slate-800">{invoice.customerTin || "241745384"}</span>
              </div>
            </div>
          </div>

          {/* 4. Particulars / Items Table */}
          <div className="border border-slate-300 rounded overflow-hidden mb-3">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#2E64A8] text-white font-bold">
                  <th className="py-2 px-3 uppercase tracking-wider">DESCRIPTION</th>
                  <th className="py-2 px-3 text-right uppercase tracking-wider w-40">
                    AMOUNT {currencyPrefix}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.amount || item.quantity * item.unitPrice, currencyCode)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 px-3 text-slate-500">Professional Services</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {formatCurrency(invoice.totalAmount, currencyCode)}
                    </td>
                  </tr>
                )}
                {/* Compact padding rows */}
                {Array.from({ length: Math.max(0, 3 - (invoice.items?.length || 1)) }).map((_, i) => (
                  <tr key={`pad-${i}`} className="bg-slate-50/50">
                    <td className="py-1.5 px-3 text-slate-300">-</td>
                    <td className="py-1.5 px-3 text-right text-slate-300">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Summary / Totals Block (Right Aligned) */}
          <div className="flex justify-end pb-4">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 px-1.5 text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(subtotal, currencyCode)}
                </span>
              </div>
              <div className="flex justify-between py-0.5 px-1.5 border-b border-slate-900 text-slate-600">
                <span>Tax</span>
                <span className="font-medium text-slate-900">
                  {tax > 0 ? formatCurrency(tax, currencyCode) : "-"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 px-2 bg-[#CFE2F3] font-bold text-xs text-slate-900 rounded">
                <span>TOTAL {currencyPrefix}</span>
                <span>{formatCurrency(total, currencyCode)}</span>
              </div>
            </div>
          </div>

          {/* 6. Payment Information Box */}
          <div className="w-full sm:w-7/12 border border-[#2E64A8] rounded overflow-hidden mb-4">
            <div className="bg-[#2E64A8] text-white px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider">
              Payment Information
            </div>
            <div className="p-2.5 text-[11px] space-y-0.5 text-slate-800">
              <p>
                <span className="font-bold">Account Name:</span> {invoice.bankAccountName || "FINNECT DIGITAL (PVT) LTD"}
              </p>
              <p>
                <span className="font-bold">Account Number:</span> {invoice.bankAccountNumber || "1001084778"}
              </p>
              <p>
                <span className="font-bold">Bank:</span> {invoice.bankName || "Commercial Bank of Ceylon PLC – Kollupitiya Branch (7056 – 011)"}
              </p>
              <p>
                <span className="font-bold">SWIFT Code:</span> {invoice.bankSwiftCode || "CCEYLKLX"}
              </p>
            </div>
          </div>

          {/* 7. Signatory Section */}
          <div className="pt-1">
            {activeSignature?.imageData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeSignature.imageData}
                alt={activeSignature.name}
                className="max-h-10 max-w-[140px] object-contain mb-0.5"
              />
            ) : isSigned && invoice.signatureData ? (
              <p className="font-serif italic text-sm text-slate-900 mb-0.5">
                {invoice.signedBy || "Thusitha"}
              </p>
            ) : (
              <p className="font-serif italic text-sm text-slate-400 mb-0.5">
                {signatureName}
              </p>
            )}
            <p className="font-bold text-xs text-slate-900">Authorized Signature</p>
            <p className="text-[10px] text-slate-500">Finance Department</p>
          </div>
        </div>

        {/* Billing Officer Electronic Signature Panel (if not signed) */}
        {!isSigned && isBillingOfficer && onSign && (
          <div className="p-4 bg-amber-50/70 border-t border-amber-200 print:hidden space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <PenTool className="w-3.5 h-3.5 text-amber-700" />
              <span>Billing Officer Action: Certify and Sign Invoice</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Signatory Name / Designation
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>I certify these invoice particulars and approve electronic stamping</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSign}
                disabled={isSigning || !agreed}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-2xs transition disabled:opacity-50 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5 inline mr-1" />
                {isSigning ? "Signing..." : "Apply Digital Signature"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
