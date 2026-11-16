"use client";

import { useEffect, useState, useMemo } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import PageToolbar from "@/components/layout/PageToolbar";
import DataTable, { ColumnDef } from "@/components/data/DataTable";
import StatusBadge from "@/components/feedback/StatusBadge";
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";

interface RoleItem {
  roleId: number;
  roleName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/Admin/roles`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (r) =>
        r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const columns: ColumnDef<RoleItem>[] = [
    {
      header: "Role ID",
      cell: (row) => <span className="font-mono text-xs text-slate-500 font-bold">#{row.roleId}</span>,
    },
    {
      header: "Role Definition",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight text-xs">{row.roleName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? "active" : "inactive"}
          label={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      header: "Created Date",
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <PageShell>
      <DarkPageHeader
        icon={<ShieldCheck className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Administration", "User Roles"]}
        pageTitle="Role Catalog"
        description="System authorization tiers and role definitions"
        onRefresh={fetchRoles}
        isRefreshing={loading}
      />

      <PageToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter system roles..."
        count={filteredRoles.length}
        countLabel="roles"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          data={filteredRoles}
          columns={columns}
          keyField="roleId"
          loading={loading}
          emptyMessage="No roles matched your search."
        />
      </div>
    </PageShell>
  );
}
