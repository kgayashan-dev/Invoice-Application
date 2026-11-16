"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Building2, User, FileText, Landmark, ShieldCheck } from "lucide-react";
import { Invoice, InvoiceItem } from "@/types/invoice";
import { AppAsset } from "@/types/asset";
import { getAssets } from "@/services/api";
import { useCurrency } from "@/Contexts/CurrencyContext";

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Partial<Invoice>) => Promise<void>;
  initialInvoice?: Invoice | null;
}

export default function InvoiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialInvoice,
}: InvoiceFormModalProps) {
  const { currency, currencyPrefix, formatAmount } = useCurrency();

  // Form Fields matching sample invoice
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [selectedCurrency, setSelectedCurrency] = useState(currency || "LKR");

  // Customer info
  const [attention, setAttention] = useState("The Accountant");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerTin, setCustomerTin] = useState("");

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "Core Banking Application Fee & support service Fees\nfor the Period",
      quantity: 1,
      unitPrice: 1035000,
      amount: 1035000,
    },
  ]);

  // Tax
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Assets
  const [logos, setLogos] = useState<AppAsset[]>([]);
  const [signatures, setSignatures] = useState<AppAsset[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<number | undefined>();
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | undefined>();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load assets
      getAssets("Logo").then((data) => {
        setLogos(data);
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) setSelectedLogoId(def.id);
      }).catch(() => {});

      getAssets("Signature").then((data) => {
        setSignatures(data);
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) setSelectedSignatureId(def.id);
      }).catch(() => {});

      if (initialInvoice) {
        setInvoiceNumber(initialInvoice.invoiceNumber);
        setIssueDate(initialInvoice.issueDate.slice(0, 10));
        setDueDate(initialInvoice.dueDate.slice(0, 10));
        setSelectedCurrency(initialInvoice.currency || currency || "LKR");
        setAttention(initialInvoice.attention || "The Accountant");
        setCustomerName(initialInvoice.customerName);
        setCustomerAddress(initialInvoice.customerAddress || "");
        setCustomerEmail(initialInvoice.customerEmail || "");
        setCustomerId(initialInvoice.customerId || "");
        setCustomerTin(initialInvoice.customerTin || "");
        setItems(
          initialInvoice.items?.length
            ? initialInvoice.items.map((i) => ({ ...i, amount: i.quantity * i.unitPrice }))
            : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]
        );
        setTaxAmount(initialInvoice.taxAmount || 0);
        setNotes(initialInvoice.notes || "");
        if (initialInvoice.logoId) setSelectedLogoId(initialInvoice.logoId);
        if (initialInvoice.signatureId) setSelectedSignatureId(initialInvoice.signatureId);
      } else {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`AP-I00${randNum}`);
        setCustomerName("");
        setCustomerAddress("");
        setCustomerEmail("");
        setCustomerId("");
        setCustomerTin("");
        setItems([
          {
            description: "Core Banking Application Fee & support service Fees\nfor the Period",
            quantity: 1,
            unitPrice: 100000,
            amount: 100000,
          },
        ]);
        setTaxAmount(0);
        setNotes("");
      }
    }
  }, [isOpen, initialInvoice, currency]);

  if (!isOpen) return null;

  // Item row operations
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        const q = field === "quantity" ? Number(value) || 0 : target.quantity;
        const p = field === "unitPrice" ? Number(value) || 0 : target.unitPrice;
        target.amount = q * p;
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalAmount = subtotal + Number(taxAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer Name is required.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setError("All line item entries must have a description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        invoiceNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        customerAddress: customerAddress.trim() || null,
        attention: attention.trim() || null,
        customerId: customerId.trim() || null,
        customerTin: customerTin.trim() || null,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        status: "Draft",
        subtotal,
        taxAmount: Number(taxAmount || 0),
        totalAmount,
        currency: selectedCurrency,
        notes: notes.trim() || null,
        logoId: selectedLogoId || null,
        signatureId: selectedSignatureId || null,
        items,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialInvoice ? "Edit Invoice" : "Create New Invoice"}
              </h2>
              <p className="text-xs text-slate-500">
                Structured layout matching official A4 QuestPDF template
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Meta Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Invoice No
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Customer ID
              </label>
              <input
                type="text"
                placeholder="e.g. CDFF"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Customer TIN
              </label>
              <input
                type="text"
                placeholder="e.g. 241745384"
                value={customerTin}
                onChange={(e) => setCustomerTin(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Bill To & Assets Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Bill To */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                <User className="w-4 h-4" />
                <span>Bill To (Client Details)</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Attention / Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Accountant"
                  value={attention}
                  onChange={(e) => setAttention(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Customer / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceylon Development Funding Froce (Pvt) Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="No. 17/27, Malwaththa Road, Negombo"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Right: PDF Branding Assets */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                <Building2 className="w-4 h-4" />
                <span>PDF Branding Assets</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Company Logo
                </label>
                <select
                  value={selectedLogoId || ""}
                  onChange={(e) => setSelectedLogoId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  <option value="">Default Company Logo</option>
                  {logos.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Appears in top-right of QuestPDF A4 invoice
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Authorized Signatory
                </label>
                <select
                  value={selectedSignatureId || ""}
                  onChange={(e) => setSelectedSignatureId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                >
                  <option value="">Default Signatory</option>
                  {signatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Stamped at bottom of invoice document
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Particulars / Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Particulars & Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-600 text-white font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Description (Supports multi-line)</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 w-36 text-right">Amount ({currencyPrefix})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3">
                        <textarea
                          rows={2}
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="e.g. Core Banking Application Fee & support service Fees"
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent resize-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className="w-full px-2 py-1 text-xs text-right rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {formatAmount(item.amount || 0)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatAmount(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Tax Amount:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-0.5 text-xs text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-blue-600 dark:text-blue-400">
                  <span>TOTAL ({currencyPrefix}):</span>
                  <span>{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : initialInvoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
