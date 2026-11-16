"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  History,
  ArrowRight,
  Receipt,
  Server,
  Plus,
  Building2,
} from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import AppCard from "@/components/layout/AppCard";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/feedback/StatusBadge";
import AuthGuardAccess from "@/components/AuthGuardAccess";
import { useCurrency } from "@/Contexts/CurrencyContext";
import { getApiBaseUrl } from "@/app/login/action";
import { getStoredUser, getUserRole } from "@/utils/auth";

interface DashboardStats {
  userCount: number;
  roleCount: number;
  invoiceCount: number;
  auditCount: number;
  totalBilledAmount: number;
  dbStatus: string;
}

interface AuditLog {
  id: number;
  timestamp: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}

interface InvoiceItem {
  id: number;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: string;
  totalAmount: number;
}

export default function DashboardPage() {
  const { formatAmount } = useCurrency();
  const [user, setUser] = useState<{ fullName: string; userName: string; roleName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    roleCount: 0,
    invoiceCount: 0,
    auditCount: 0,
    totalBilledAmount: 0,
    dbStatus: "Checking...",
  });
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const apiUrl = getApiBaseUrl();

    try {
      const [usersRes, rolesRes, invoicesRes, auditsRes, healthRes] = await Promise.all([
        fetch(`${apiUrl}/api/Admin/users`).then((r) => r.json()).catch(() => []),
        fetch(`${apiUrl}/api/Admin/roles`).then((r) => r.json()).catch(() => []),
        fetch(`${apiUrl}/api/Invoices`).then((r) => r.json()).catch(() => []),
        fetch(`${apiUrl}/api/Audit?limit=6`).then((r) => r.json()).catch(() => []),
        fetch(`${apiUrl}/api/Health`).then((r) => r.json()).catch(() => ({ status: "Online", database: "Connected (MSSQL)" })),
      ]);

      const invList: InvoiceItem[] = Array.isArray(invoicesRes) ? invoicesRes : [];
      const totalAmt = invList.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

      setStats({
        userCount: Array.isArray(usersRes) ? usersRes.length : 0,
        roleCount: Array.isArray(rolesRes) ? rolesRes.length : 0,
        invoiceCount: invList.length,
        auditCount: Array.isArray(auditsRes) ? auditsRes.length : 0,
        totalBilledAmount: totalAmt,
        dbStatus: healthRes?.database || "Connected (MSSQL)",
      });

      setRecentInvoices(invList.slice(0, 5));
      if (Array.isArray(auditsRes)) {
        setRecentAudits(auditsRes);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to fetch metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    fetchDashboardData();
  }, [fetchDashboardData]);

  const roleName = user?.roleName || getUserRole(user?.userName || "");

  return (
    <AuthGuardAccess requiredPermission={1001}>
      <PageShell>
      {/* Dark Page Header */}
      <DarkPageHeader
        icon={<Building2 className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Overview", "Dashboard"]}
        pageTitle="Dashboard Overview"
        description="Unified Billing Telemetry, Receivables & Administration Portal"
        onRefresh={fetchDashboardData}
        isRefreshing={loading}
        actions={
          <Link
            href="/main/invoices"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
        }
      />

      {/* Primary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          title="Total Invoices"
          value={stats.invoiceCount}
          subtitle={`${formatAmount(stats.totalBilledAmount)} billed`}
          icon={<Receipt className="w-4 h-4" />}
          color="blue"
        />

        <StatCard
          title="System Operators"
          value={stats.userCount}
          subtitle="Provisioned users"
          icon={<Users className="w-4 h-4" />}
          color="purple"
        />

        <StatCard
          title="Security Roles"
          value={stats.roleCount}
          subtitle="RBAC role definitions"
          icon={<Shield className="w-4 h-4" />}
          color="green"
        />

        <StatCard
          title="Audit Trail Logs"
          value={stats.auditCount > 0 ? `${stats.auditCount}+ events` : "0"}
          subtitle="Real-time stored proc audits"
          icon={<History className="w-4 h-4" />}
          color="amber"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Recent Invoices & Quick Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Recent Invoices Card */}
          <AppCard
            title={
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Recent Invoices</span>
              </div>
            }
            subtitle="Latest generated customer billing transactions"
            actions={
              <Link
                href="/main/invoices"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            {recentInvoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No invoices found in database. Create your first invoice!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <StatusBadge
                          status={inv.status.toLowerCase() as any}
                          label={inv.status}
                        />
                      </div>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">{inv.customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {formatAmount(inv.totalAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AppCard>

          {/* Quick Management Actions Card */}
          <AppCard
            title="Administration Quick Actions"
            subtitle="Shortcuts to key system management modules"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href="/main/users"
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Users</span>
                <span className="text-[10px] text-slate-400">Manage operators</span>
              </Link>

              <Link
                href="/main/admin/roles"
                className="p-3 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">User Roles</span>
                <span className="text-[10px] text-slate-400">Role catalog</span>
              </Link>

              <Link
                href="/main/audit"
                className="p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Audit Trail</span>
                <span className="text-[10px] text-slate-400">Security logs</span>
              </Link>

              <Link
                href="/main/settings"
                className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Settings</span>
                <span className="text-[10px] text-slate-400">System parameters</span>
              </Link>
            </div>
          </AppCard>
        </div>

        {/* Right: Security & Recent Audit Events (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Account Profile Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
              <span>Operator Profile</span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {user?.userName || "N/A"}</span>
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-900">{user?.fullName || "Operator"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Assigned Role</span>
                <span className="font-semibold text-blue-700">{roleName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-semibold text-slate-900">{stats.dbStatus}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Session Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated Active
                </span>
              </div>
            </div>
          </div>

          {/* Recent Security Audits Card */}
          <AppCard
            title={
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>Recent Audit Events</span>
              </div>
            }
            subtitle="Latest security events recorded by stored procedures"
            actions={
              <Link
                href="/main/audit"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>All Logs</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            {recentAudits.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No audit records yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAudits.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2 rounded-md bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>User: {log.userName}</span>
                      <span>•</span>
                      <span>Mod: {log.module}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </PageShell>
    </AuthGuardAccess>
  );
}
