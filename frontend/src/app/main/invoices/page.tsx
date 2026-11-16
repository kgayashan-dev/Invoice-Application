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
  FileSpreadsheet,
} from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import PageToolbar from "@/components/layout/PageToolbar";
import DataTable, { ColumnDef } from "@/components/data/DataTable";
import StatusBadge from "@/components/feedback/StatusBadge";
import AppAlert from "@/components/feedback/AppAlert";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
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
  downloadAllInvoicesExcel,
} from "@/services/api";
import InvoicePrintModal from "@/components/invoices/InvoicePrintModal";
import RequestSignatureModal from "@/components/invoices/RequestSignatureModal";
import InvoiceFormModal from "@/components/invoices/InvoiceFormModal";

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
  const [isExportingAll, setIsExportingAll] = useState(false);

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

  const handleCreate = async (invoiceData: Partial<Invoice>) => {
    try {
      await createInvoice(invoiceData);
      setMessage({
        text: `Invoice #${invoiceData.invoiceNumber} created successfully!`,
        type: "success",
      });
      await fetchInvoices();
    } catch (err: unknown) {
      throw err;
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
        text: `Signature requested for invoice #${res.invoiceNumber}. Billing Officer has been notified.`,
        type: "success",
      });
      setRequestSignTarget(null);
      await fetchInvoices();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to request signature.",
        type: "error",
      });
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleSignInvoice = async (invoiceId: number, signatureData: string, signatureId?: number) => {
    setIsSubmittingWorkflow(true);
    try {
      const res = await signInvoice(invoiceId, signatureData, signatureId);
      setMessage({
        text: `Invoice signed and certified by ${res.signedBy}. Ready for printing & client distribution.`,
        type: "success",
      });
      setPrintTarget(null);
      await fetchInvoices();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to sign invoice.",
        type: "error",
      });
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleExportAllReport = async () => {
    setIsExportingAll(true);
    try {
      await downloadAllInvoicesExcel();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to export report.",
        type: "error",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q)) ||
        (inv.signedBy && inv.signedBy.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        inv.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const columns: ColumnDef<Invoice>[] = [
    {
      header: "Invoice #",
      key: "invoiceNumber",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-400" />
          <button
            type="button"
            onClick={() => setPrintTarget(row)}
            className="font-bold text-blue-600 hover:text-blue-800 text-xs font-mono hover:underline cursor-pointer"
          >
            {row.invoiceNumber}
          </button>
        </div>
      ),
    },
    {
      header: "Client / Entity",
      key: "customerName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{row.customerName}</div>
          {row.attention && (
            <div className="text-[11px] text-slate-400">{row.attention}</div>
          )}
        </div>
      ),
    },
    {
      header: "Issue Date",
      key: "issueDate",
      cell: (row) => (
        <span className="text-slate-600 text-xs font-mono">
          {new Date(row.issueDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Status & Certification",
      key: "status",
      cell: (row) => {
        const isSigned = Boolean(row.signedBy || row.status === "Signed & Ready");
        return (
          <div className="space-y-0.5">
            <StatusBadge status={row.status} />
            {isSigned && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Signed by {row.signedBy}</span>
              </div>
            )}
            {row.status === "Awaiting Signature" && (
              <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium animate-pulse">
                <PenTool className="w-3 h-3 text-amber-600" />
                <span>Pending Billing Officer sign</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      key: "totalAmount",
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
          description={`Customer invoices ledger with PDF export & Excel reporting (${currencyPrefix.trim()})`}
          onRefresh={fetchInvoices}
          isRefreshing={loading}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAllReport}
                disabled={isExportingAll || invoices.length === 0}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Export complete particulars report across all invoices to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isExportingAll ? "Exporting..." : "Export Excel"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </button>
            </div>
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
            <div className="flex items-center gap-1 flex-wrap">
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
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
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

        {/* Structured Intuitive Invoice Creation Modal */}
        <InvoiceFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Invoice Record"
          message={`Are you sure you want to permanently delete invoice ${deleteTarget?.invoiceNumber}? This action cannot be reversed.`}
          confirmLabel="Delete Permanently"
          variant="danger"
          onConfirm={handleDelete}
        />

        {/* Request Signature Modal (Finance Manager) */}
        <RequestSignatureModal
          isOpen={Boolean(requestSignTarget)}
          invoice={requestSignTarget}
          onClose={() => setRequestSignTarget(null)}
          onSubmit={handleRequestSignature}
          isSubmitting={isSubmittingWorkflow}
        />

        {/* QuestPDF & ClosedXML Document & Signature Modal */}
        <InvoicePrintModal
          isOpen={Boolean(printTarget)}
          invoice={printTarget}
          onClose={() => setPrintTarget(null)}
          onSign={handleSignInvoice}
          userRole={userRole}
          userFullName={user?.fullName}
          userName={user?.userName}
        />
      </PageShell>
    </AuthGuardAccess>
  );
}
