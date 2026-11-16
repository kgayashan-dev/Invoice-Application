"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Lock,
  Unlock,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Plus,
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
import { getApiBaseUrl } from "@/app/login/action";
import { getInitials, getAuthHeaders } from "@/utils/auth";

interface UserItem {
  loginID: string;
  userName: string;
  fullName: string;
  displayName?: string;
  email?: string;
  contactNumber?: string;
  nic?: string;
  roleName: string;
  isLockedOut: boolean;
  isLockedPermanently?: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginDate?: string;
}

interface RoleItem {
  roleId: number;
  roleName: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"I" | "U">("I");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lock target
  const [lockTarget, setLockTarget] = useState<UserItem | null>(null);
  const [lockLoading, setLockLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    loginID: "",
    userName: "",
    fullName: "",
    displayName: "",
    email: "",
    contactNumber: "",
    nic: "",
    password: "",
    roleName: "User",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${apiUrl}/api/Admin/users`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/Admin/roles`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to load users.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setModalMode("I");
    setForm({
      loginID: "",
      userName: "",
      fullName: "",
      displayName: "",
      email: "",
      contactNumber: "",
      nic: "",
      password: "",
      roleName: roles[0]?.roleName || "User",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setModalMode("U");
    setForm({
      loginID: u.loginID,
      userName: u.userName,
      fullName: u.fullName,
      displayName: u.displayName || u.fullName,
      email: u.email || "",
      contactNumber: u.contactNumber || "",
      nic: u.nic || "",
      password: "",
      roleName: u.roleName || "User",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/Admin/InsertOrUpdate_User`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: modalMode,
          loginID: modalMode === "U" ? form.loginID : null,
          userName: form.userName.trim(),
          fullName: form.fullName.trim(),
          displayName: form.displayName?.trim() || form.fullName.trim(),
          email: form.email?.trim() || null,
          contactNumber: form.contactNumber?.trim() || null,
          nic: form.nic?.trim() || null,
          password: form.password?.trim() || null,
          roleName: form.roleName,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save user.");
      }

      setMessage({ text: data.message || "User saved successfully.", type: "success" });
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error saving user.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!lockTarget) return;
    setLockLoading(true);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/Admin/ToggleLockUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          loginID: lockTarget.loginID,
          lock: !lockTarget.isLockedOut,
          reason: !lockTarget.isLockedOut ? "Account locked by Administrator" : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed.");

      setMessage({ text: data.message, type: "success" });
      setLockTarget(null);
      await fetchUsers();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error toggling lock.",
        type: "error",
      });
    } finally {
      setLockLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        u.userName.toLowerCase().includes(s) ||
        u.fullName.toLowerCase().includes(s) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        u.roleName.toLowerCase().includes(s);

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return u.isActive && !u.isLockedOut;
      if (statusFilter === "LOCKED") return u.isLockedOut;
      return true;
    });
  }, [users, searchTerm, statusFilter]);

  const columns: ColumnDef<UserItem>[] = [
    {
      header: "Operator",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            {getInitials(row.fullName || row.userName)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 leading-tight">{row.fullName}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">@{row.userName}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Email & Contact",
      cell: (row) => (
        <div className="text-xs">
          <div className="text-slate-800 font-medium">{row.email || "—"}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{row.contactNumber || row.nic || "—"}</div>
        </div>
      ),
    },
    {
      header: "Security Role",
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.roleName}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.isLockedOut ? "inactive" : row.isActive ? "active" : "pending"}
          label={row.isLockedOut ? "Locked" : row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLockTarget(row)}
            className={`p-1.5 rounded-md transition-colors ${
              row.isLockedOut
                ? "text-rose-600 hover:bg-rose-50"
                : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
            }`}
            title={row.isLockedOut ? "Unlock Account" : "Lock Account"}
          >
            {row.isLockedOut ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuardAccess requiredPermission={1002}>
      <PageShell>
      {/* Dark Page Header */}
      <DarkPageHeader
        icon={<Users className="w-4 h-4 text-cyan-400" />}
        breadcrumbs={["Home", "Administration", "Users"]}
        pageTitle="User Management"
        description="Manage system operator profiles, credential states, and access locks"
        onRefresh={fetchUsers}
        isRefreshing={loading}
        actions={
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        }
      />

      {/* Alert banner */}
      {message && (
        <AppAlert
          variant={message.type === "success" ? "success" : "error"}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </AppAlert>
      )}

      {/* Page Toolbar */}
      <PageToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter operators by name, username, email..."
        count={filteredUsers.length}
        countLabel="operators"
        filters={
          <div className="flex items-center gap-1.5">
            {["ALL", "ACTIVE", "LOCKED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {st === "ALL" ? "All Users" : st === "ACTIVE" ? "Active Only" : "Locked Only"}
              </button>
            ))}
          </div>
        }
      />

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsers}
          keyField="loginID"
          loading={loading}
          emptyMessage="No operators matched your criteria."
        />
      </div>

      {/* Create / Edit Form Dialog */}
      <FormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "I" ? "Create System User" : "Update User Details"}
        subtitle={modalMode === "I" ? "Provision a new operator in MSSQL" : `Modify account: @${form.userName}`}
        onSubmit={handleSubmit}
        isSubmitting={saving}
        submitLabel={modalMode === "I" ? "Create User" : "Save Changes"}
      >
        <div className="space-y-3.5 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="User Name" required>
              <TextInput
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                placeholder="e.g. jsmith"
                disabled={modalMode === "U"}
                required
              />
            </FormField>

            <FormField label="Full Name" required>
              <TextInput
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. John Smith"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Email Address">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@invoiceapp.com"
              />
            </FormField>

            <FormField label="Contact Number">
              <TextInput
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="+1 555-0199"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="NIC / National ID">
              <TextInput
                value={form.nic}
                onChange={(e) => setForm({ ...form, nic: e.target.value })}
                placeholder="National ID"
              />
            </FormField>

            <FormField label="Assigned Role" required>
              <select
                value={form.roleName}
                onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleName}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField
            label={modalMode === "I" ? "Initial Password" : "Change Password (optional)"}
            required={modalMode === "I"}
          >
            <div className="relative">
              <TextInput
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={modalMode === "I" ? "Minimum 6 characters" : "Leave blank to keep unchanged"}
                required={modalMode === "I"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
        </div>
      </FormDialog>

      {/* Lock / Unlock Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(lockTarget)}
        onClose={() => setLockTarget(null)}
        onConfirm={handleToggleLock}
        title={lockTarget?.isLockedOut ? "Unlock Account" : "Lock User Account"}
        message={
          lockTarget?.isLockedOut
            ? `Are you sure you want to unlock '${lockTarget.userName}'? They will be allowed to log in immediately.`
            : `Are you sure you want to lock '${lockTarget?.userName}'? They will be prevented from accessing the application.`
        }
        confirmLabel={lockTarget?.isLockedOut ? "Unlock Account" : "Lock Account"}
        variant={lockTarget?.isLockedOut ? "primary" : "danger"}
        isLoading={lockLoading}
      />
    </PageShell>
    </AuthGuardAccess>
  );
}
