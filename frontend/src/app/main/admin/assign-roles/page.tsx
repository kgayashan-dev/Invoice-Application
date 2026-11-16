"use client";

import { useEffect, useState, useMemo } from "react";
import { UserCheck, Shield, CheckCircle2 } from "lucide-react";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import PageToolbar from "@/components/layout/PageToolbar";
import DataTable, { ColumnDef } from "@/components/data/DataTable";
import AppAlert from "@/components/feedback/AppAlert";
import FormDialog from "@/components/dialogs/FormDialog";
import { getApiBaseUrl } from "@/app/login/action";
import { getInitials, getAuthHeaders } from "@/utils/auth";

interface UserItem {
  loginID: string;
  userName: string;
  fullName: string;
  roleName: string;
  email?: string;
}

interface RoleItem {
  roleId: number;
  roleName: string;
}

export default function AssignRolesPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const [uRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/api/Admin/users`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/Admin/roles`, { headers: getAuthHeaders() }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (u: UserItem) => {
    setSelectedUser(u);
    setTargetRole(u.roleName);
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !targetRole) return;
    setSaving(true);
    setMessage(null);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/Admin/AssignRole`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          loginID: selectedUser.loginID,
          roleName: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign role.");

      setMessage({ text: data.message || "Role updated successfully.", type: "success" });
      setSelectedUser(null);
      await fetchData();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error assigning role.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const columns: ColumnDef<UserItem>[] = [
    {
      header: "Operator",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            {getInitials(row.fullName || row.userName)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-tight text-xs">{row.fullName}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">@{row.userName}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Current Role",
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.roleName}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (row) => (
        <button
          onClick={() => openAssignModal(row)}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          Change Role
        </button>
      ),
    },
  ];

  return (
    <PageShell>
      <DarkPageHeader
        icon={<UserCheck className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Administration", "Assign Roles"]}
        pageTitle="Role Assignments"
        description="Assign operator authorization tiers via Stored Procedures"
        onRefresh={fetchData}
        isRefreshing={loading}
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
        searchPlaceholder="Filter operators by name or role..."
        count={filteredUsers.length}
        countLabel="operators"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          data={filteredUsers}
          columns={columns}
          keyField="loginID"
          loading={loading}
          emptyMessage="No operators found."
        />
      </div>

      <FormDialog
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Assign Security Role"
        subtitle={`Select new role for @${selectedUser?.userName}`}
        onSubmit={handleAssignRole}
        isSubmitting={saving}
        submitLabel="Confirm Role Assignment"
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-slate-600">
            Current Role: <span className="font-bold text-slate-900">{selectedUser?.roleName}</span>
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">New Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleName}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormDialog>
    </PageShell>
  );
}
