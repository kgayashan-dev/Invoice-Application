"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Building2, User, FileText } from "lucide-react";
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
      description: "Core Banking Application Fee & support service Fees\nfor the Period 11/10/2026 to 10/11/2026",
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
            description: "Core Banking Application Fee & support service Fees\nfor the Period 11/10/2026 to 10/11/2026",
            quantity: 1,
            unitPrice: 1035000,
            amount: 1035000,
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
      setError("Customer / Entity Name is required.");
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
        customerEmail: customerEmail.trim() || "",
        customerAddress: customerAddress.trim() || "",
        attention: attention.trim() || "The Accountant",
        customerId: customerId.trim() || "CDFF",
        customerTin: customerTin.trim() || "241745384",
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
      setError(err instanceof Error ? err.message : "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      {/* High-visibility clean white compact modal container */}
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 overflow-hidden my-2">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-md shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {initialInvoice ? "Edit Invoice" : "Create New Invoice"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Enter invoice details and particulars
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2.5 p-2 bg-red-50 border border-red-300 text-red-800 rounded text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto bg-white">
          {/* Top Meta Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                Invoice No *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-bold font-mono rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                Customer ID
              </label>
              <input
                type="text"
                placeholder="e.g. CDFF"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                Customer TIN
              </label>
              <input
                type="text"
                placeholder="e.g. 241745384"
                value={customerTin}
                onChange={(e) => setCustomerTin(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Bill To & Assets Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Left: Bill To */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-blue-700">
                <User className="w-3.5 h-3.5" />
                <span>Bill To (Client Details)</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Attention / Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Accountant"
                  value={attention}
                  onChange={(e) => setAttention(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Customer / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceylon Development Funding Froce (Pvt) Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs font-bold rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. No. 17/27, Malwaththa Road, Negombo"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 resize-none"
                />
              </div>
            </div>

            {/* Right: PDF Branding Assets */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-blue-700">
                <Building2 className="w-3.5 h-3.5" />
                <span>Branding & Signatures</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Company Logo
                </label>
                <select
                  value={selectedLogoId || ""}
                  onChange={(e) => setSelectedLogoId(Number(e.target.value) || undefined)}
                  className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                >
                  <option value="">Default Company Logo</option>
                  {logos.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Placed on top-right of invoice
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Authorized Signatory
                </label>
                <select
                  value={selectedSignatureId || ""}
                  onChange={(e) => setSelectedSignatureId(Number(e.target.value) || undefined)}
                  className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                >
                  <option value="">Default Signatory</option>
                  {signatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Stamped at bottom of invoice
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Particulars / Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Particulars & Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-600 text-white font-bold text-[11px]">
                    <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                    <th className="py-1.5 px-2.5">Description (Supports multi-line)</th>
                    <th className="py-1.5 px-2 w-16 text-center">Qty</th>
                    <th className="py-1.5 px-2.5 w-28 text-right">Unit Price</th>
                    <th className="py-1.5 px-2.5 w-32 text-right">Amount ({currencyPrefix})</th>
                    <th className="py-1.5 px-1.5 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-400 text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-2.5">
                        <textarea
                          rows={2}
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="e.g. Core Banking Application Fee & support service Fees"
                          className="w-full px-2 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600 resize-none"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="w-full px-1.5 py-1 text-xs font-semibold text-center rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className="w-full px-2 py-1 text-xs font-semibold text-right rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 text-xs">
                        {formatAmount(item.amount || 0)}
                      </td>
                      <td className="py-1.5 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-red-600 rounded disabled:opacity-20 transition cursor-pointer"
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
            <div className="flex justify-end pt-1">
              <div className="w-72 p-3 rounded-lg border border-slate-300 bg-white shadow-2xs space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">
                    {formatAmount(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Tax Amount:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-20 px-1.5 py-0.5 text-xs font-semibold text-right rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>

                <div className="pt-1.5 border-t border-slate-300 flex justify-between text-xs font-extrabold text-blue-700 bg-blue-50/70 p-1.5 rounded">
                  <span>TOTAL ({currencyPrefix}):</span>
                  <span>{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Saving..." : initialInvoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
