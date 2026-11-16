"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth, getInvoices, createInvoice, deleteInvoice } from "@/services/api";
import { Invoice, HealthCheckResponse } from "@/types/invoice";

export default function Home() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [itemDesc, setItemDesc] = useState("Consulting Services");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const healthData = await checkBackendHealth();
      setHealth(healthData);
      const invoicesData = await getInvoices();
      setInvoices(invoicesData);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to backend.";
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setIsSubmitting(true);
    try {
      await createInvoice({
        customerName,
        customerEmail,
        status: "Pending",
        items: [
          {
            description: itemDesc,
            quantity: Number(itemQty),
            unitPrice: Number(itemPrice),
          },
        ],
      });
      setCustomerName("");
      setCustomerEmail("");
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete invoice #${id}?`)) return;
    try {
      await deleteInvoice(id);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting invoice");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Invoice Application</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Next.js Frontend • .NET 8 Web API • Microsoft SQL Server (MSSQL)
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition cursor-pointer self-start sm:self-auto"
          >
            Refresh Status
          </button>
        </header>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Frontend</div>
            <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">Next.js 16 (App Router)</div>
            <div className="text-xs text-slate-500 mt-1">Port: 3000 • Tailwind CSS • TypeScript</div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Backend API</div>
            <div className={`text-xl font-bold mt-1 ${health?.status === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {health?.status === 'Healthy' ? '.NET 8 Web API (Online)' : apiError ? 'Offline / Unreachable' : 'Connecting...'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Port: 5038 • Swagger UI Enabled</div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database</div>
            <div className={`text-xl font-bold mt-1 ${health?.database?.includes('MSSQL') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {health?.database || 'MSSQL Database'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Database: InvoiceAppDb • EF Core 8</div>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
            <p className="font-semibold">Backend Connection Notice:</p>
            <p className="mt-1">{apiError}</p>
            <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
              Run <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">dotnet run</code> inside the <code className="font-mono">backend</code> directory to start the API.
            </p>
          </div>
        )}

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Invoice Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
            <h2 className="text-lg font-bold mb-4">Create Quick Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  placeholder="billing@acme.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>

          {/* Invoice List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
            <h2 className="text-lg font-bold mb-4">Invoices in Database</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm text-slate-400">No invoices yet in MSSQL database.</p>
                <p className="text-xs text-slate-500 mt-1">Create one using the form on the left!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase">
                      <th className="py-2">Number</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 font-mono font-medium">{inv.invoiceNumber}</td>
                        <td className="py-3">
                          <div className="font-medium">{inv.customerName}</div>
                          <div className="text-xs text-slate-400">{inv.customerEmail}</div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">${inv.totalAmount.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => inv.id && handleDelete(inv.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
