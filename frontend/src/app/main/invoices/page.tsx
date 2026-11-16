"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, Plus, Trash2, Calendar, DollarSign, Receipt } from "lucide-react";
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
import { Invoice } from "@/types/invoice";
import { getInvoices, createInvoice, deleteInvoice } from "@/services/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState<"Draft" | "Pending" | "Paid">("Pending");
  const [itemDesc, setItemDesc] = useState("Professional Services");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(250);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
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
    fetchInvoices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvoice({
        customerName,
        customerEmail,
        status,
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
      cell: (row) => <span className="font-mono font-bold text-slate-900 text-xs">{row.invoiceNumber}</span>,
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
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.status.toLowerCase() as any}
          label={row.status}
        />
      ),
    },
    {
      header: "Total Amount",
      align: "right",
      cell: (row) => (
        <span className="font-bold text-slate-900 text-xs font-mono">
          ${Number(row.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Delete Invoice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      <DarkPageHeader
        icon={<Receipt className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Billing", "Invoices"]}
        pageTitle="Invoice Registry"
        description="Customer invoices and receivable ledger backed by SQL Server stored procedures"
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
          <div className="flex items-center gap-1.5">
            {["ALL", "PAID", "PENDING", "DRAFT"].map((st) => (
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
        subtitle="Generate invoice header & line items in MSSQL database"
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

          <FormField label="Invoice Status" required>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
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
                  placeholder="Price"
                  required
                />
              </div>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200 text-slate-500">
              <span>Item Line Total:</span>
              <span className="font-bold text-slate-900 font-mono">
                ${(itemQty * itemPrice).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </FormDialog>

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
  );
}
