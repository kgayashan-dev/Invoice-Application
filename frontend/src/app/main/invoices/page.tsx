"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  Receipt,
  Printer,
  PenTool,
  Send,
  ShieldCheck,
  Eye,
  FileCheck2,
} from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import PageToolbar from "@/components/layout/PageToolbar";
import DataTable, { ColumnDef } from "@/components/data/DataTable";
import StatusBadge from "@/components/feedback/StatusBadge";
import AppAlert from "@/components/feedback/AppAlert";
import FormDialog from "@/components/dialogs/FormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import FormField from "@/components/forms/FormField";
import TextInput from "@/components/forms/TextInput";
import AuthGuardAccess from "@/components/AuthGuardAccess";
import { useCurrency } from "@/Contexts/CurrencyContext";
import { getStoredUser } from "@/utils/auth";
import { Invoice } from "@/types/invoice";
import {
  getInvoices,
  createInvoice,
  deleteInvoice,
  requestInvoiceSignature,
  signInvoice,
} from "@/services/api";
import InvoicePrintModal from "@/components/invoices/InvoicePrintModal";
import RequestSignatureModal from "@/components/invoices/RequestSignatureModal";

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const { formatAmount, currency, currencyPrefix } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Workflow modals
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const [requestSignTarget, setRequestSignTarget] = useState<Invoice | null>(null);
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState<"Draft" | "Pending" | "Paid">("Pending");
  const [itemDesc, setItemDesc] = useState("Professional Services");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(250);
  const [submitting, setSubmitting] = useState(false);

  // User identity
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const userRole = user?.roleName || "User";
  const userRoleLower = userRole.toLowerCase();

  const isFinanceManager =
    userRoleLower.includes("finance") ||
    userRoleLower.includes("administrator") ||
    userRoleLower === "admin";

  const isBillingOfficer =
    userRoleLower.includes("billing") ||
    userRoleLower.includes("administrator") ||
    userRoleLower === "admin";

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      const list = Array.isArray(data) ? data : [];
      setInvoices(list);

      // Check if URL search query requested a specific invoice
      const urlQuery = searchParams.get("search");
      if (urlQuery) {
        setSearchTerm(urlQuery);
        const matched = list.find((i) => i.invoiceNumber.toLowerCase() === urlQuery.toLowerCase());
        if (matched) {
          setPrintTarget(matched);
        }
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error loading invoices.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvoice({
        customerName,
        customerEmail,
        status,
        currency: currency,
        items: [
          {
            description: itemDesc,
            quantity: Number(itemQty),
            unitPrice: Number(itemPrice),
          },
        ],
      });
      setMessage({ text: "Invoice created successfully via Stored Procedure.", type: "success" });
      setIsModalOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      await fetchInvoices();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to create invoice.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteInvoice(deleteTarget.id);
      setMessage({ text: "Invoice deleted successfully.", type: "success" });
      setDeleteTarget(null);
      await fetchInvoices();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to delete.",
        type: "error",
      });
    }
  };

  const handleRequestSignature = async (invoiceId: number, notes: string) => {
    setIsSubmittingWorkflow(true);
    try {
      const res = await requestInvoiceSignature(invoiceId, notes);
      setMessage({
        text: res.message || "Signature request sent to Billing Officer.",
        type: "success",
      });
      setRequestSignTarget(null);
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
      await fetchInvoices();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to request signature.",
        type: "error",
      });
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleSignInvoice = async (invoiceId: number, signatureData: string) => {
    try {
      const res = await signInvoice(invoiceId, signatureData);
      setMessage({
        text: res.message || "Invoice signed and verified successfully.",
        type: "success",
      });
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
      await fetchInvoices();
      if (printTarget && printTarget.id === invoiceId) {
        setPrintTarget((prev) =>
          prev
            ? {
                ...prev,
                status: "Signed & Ready",
                signedBy: res.signedBy || user?.fullName || user?.userName || "Billing Officer",
                signedAt: new Date().toISOString(),
                signatureData,
              }
            : null
        );
      }
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to sign invoice.",
        type: "error",
      });
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(s) ||
        inv.customerName.toLowerCase().includes(s) ||
        (inv.customerEmail && inv.customerEmail.toLowerCase().includes(s));

      if (!matchesSearch) return false;

      if (statusFilter !== "ALL") {
        return inv.status.toUpperCase() === statusFilter;
      }
      return true;
    });
  }, [invoices, searchTerm, statusFilter]);

  const columns: ColumnDef<Invoice>[] = [
    {
      header: "Invoice #",
      cell: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setPrintTarget(row)}
            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer block text-left"
          >
            {row.invoiceNumber}
          </button>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.currency || currency}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{row.customerName}</div>
          <div className="text-[11px] text-slate-400">{row.customerEmail || "No email"}</div>
        </div>
      ),
    },
    {
      header: "Dates",
      cell: (row) => (
        <div className="text-[11px] text-slate-600 font-mono">
          <div>Issued: {new Date(row.issueDate).toLocaleDateString()}</div>
          <div className="text-slate-400">Due: {new Date(row.dueDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: "Workflow Status",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} label={row.status} />
          {row.signedBy && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Signed by @{row.signedBy}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Total Amount",
      align: "right",
      cell: (row) => (
        <span className="font-bold text-slate-900 text-xs font-mono">
          {formatAmount(row.totalAmount, row.currency)}
        </span>
      ),
    },
    {
      header: "Workflow Actions",
      align: "right",
      cell: (row) => {
        const isSigned = Boolean(row.signedBy || row.status === "Signed & Ready");
        const isAwaitingSig = row.status === "Awaiting Signature";

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Finance Manager: Request Signature */}
            {isFinanceManager && !isSigned && (
              <button
                type="button"
                onClick={() => setRequestSignTarget(row)}
                className="px-2 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Send request to Billing Officer to review and sign this invoice"
              >
                <Send className="w-3 h-3 text-blue-600" />
                <span>Request Sign</span>
              </button>
            )}

            {/* Billing Officer: Sign & Print */}
            {isBillingOfficer && !isSigned && (
              <button
                type="button"
                onClick={() => setPrintTarget(row)}
                className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                  isAwaitingSig
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs animate-pulse"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
                title="Sign this invoice electronically and print PDF"
              >
                <PenTool className="w-3 h-3" />
                <span>{isAwaitingSig ? "Sign & Print" : "Put Signature"}</span>
              </button>
            )}

            {/* View & Print PDF (Always available) */}
            <button
              type="button"
              onClick={() => setPrintTarget(row)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="View Document & Print PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Delete Invoice */}
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Delete Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AuthGuardAccess requiredPermission={8001}>
      <PageShell>
        <DarkPageHeader
          icon={<Receipt className="w-4 h-4 text-cyan-400" />}
          breadcrumbs={["Home", "Billing", "Invoices"]}
          pageTitle="Invoice Registry"
          description={`Customer invoices ledger with signature workflow & dynamic currency (${currencyPrefix.trim()})`}
          onRefresh={fetchInvoices}
          isRefreshing={loading}
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          }
        />

        {message && (
          <AppAlert
            variant={message.type === "success" ? "success" : "error"}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </AppAlert>
        )}

        <PageToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filter invoices by number, customer, email..."
          count={filteredInvoices.length}
          countLabel="invoices"
          filters={
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                "ALL",
                "AWAITING SIGNATURE",
                "SIGNED & READY",
                "PENDING",
                "PAID",
                "DRAFT",
              ].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Invoices" : st}
                </button>
              ))}
            </div>
          }
        />

        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredInvoices}
            keyField="id"
            loading={loading}
            emptyMessage="No invoices found matching your filter criteria."
          />
        </div>

        {/* Create Modal */}
        <FormDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Invoice"
          subtitle={`Generate invoice header & line items in MSSQL database (Currency: ${currencyPrefix.trim()})`}
          onSubmit={handleCreate}
          isSubmitting={submitting}
          submitLabel="Generate Invoice"
        >
          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Customer Name" required>
                <TextInput
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                />
              </FormField>

              <FormField label="Customer Email">
                <TextInput
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@acme.com"
                />
              </FormField>
            </div>

            <FormField label="Initial Invoice Status" required>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending Review</option>
                <option value="Paid">Paid</option>
              </select>
            </FormField>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700">Initial Line Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <TextInput
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Service description"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <TextInput
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    placeholder="Qty"
                    required
                  />
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    placeholder={`Price (${currencyPrefix.trim()})`}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200 text-slate-500">
                <span>Item Line Total:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatAmount(itemQty * itemPrice)}
                </span>
              </div>
            </div>
          </div>
        </FormDialog>

        {/* Request Signature Modal (Finance Manager -> Billing Officer) */}
        <RequestSignatureModal
          invoice={requestSignTarget}
          isOpen={Boolean(requestSignTarget)}
          onClose={() => setRequestSignTarget(null)}
          onSubmit={handleRequestSignature}
          isSubmitting={isSubmittingWorkflow}
        />

        {/* Printable Invoice & Digital Signature Modal */}
        <InvoicePrintModal
          invoice={printTarget}
          isOpen={Boolean(printTarget)}
          onClose={() => setPrintTarget(null)}
          onSign={handleSignInvoice}
          userRole={userRole}
          userFullName={user?.fullName || ""}
          userName={user?.userName || ""}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${deleteTarget?.invoiceNumber}? All associated line items and billing history will be removed.`}
          confirmLabel="Delete Invoice"
          variant="danger"
        />
      </PageShell>
    </AuthGuardAccess>
  );
}
