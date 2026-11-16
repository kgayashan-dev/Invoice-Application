"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { getApiBaseUrl } from "@/app/login/action";
import AuthGuardAccess from "@/components/AuthGuardAccess";
import { ACCESS_ID } from "@/utils/access";
import { usePermissions } from "@/Contexts/PermissionContext";
import DarkPageHeader from "@/components/DarkPageHeader";
import PageShell from "@/components/layout/PageShell";
import AppAlert from "@/components/feedback/AppAlert";
import { normalizeApiError } from "@/utils/error";
import { getAuthHeaders } from "@/utils/auth";

interface RoleItem {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean | number;
}

interface MenuAccessItem {
  roleID: number;
  roleName: string;
  accessID: number;
  functionID: number;
  menuID: number;
  moduleID: number;
  moduleName: string;
  functionName: string;
  menuName: string;
  navigationURL: string;
  displayOrder: number;
  isActive: number;
}

export default function RoleWiseMenuAccessPage() {
  const { refreshPermissions } = usePermissions();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRoleID, setSelectedRoleID] = useState<number>(1);
  const [menuAccessList, setMenuAccessList] = useState<MenuAccessItem[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<number>>(new Set());
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/Admin/roles`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const rawRoles = Array.isArray(data) ? data : [];
        const normalizedRoles: RoleItem[] = rawRoles.map((r: Record<string, unknown>) => ({
          roleId: Number(r.roleId ?? r.RoleID ?? r.roleID ?? 0),
          roleName: String(r.roleName ?? r.RoleName ?? ""),
          description: r.description ? String(r.description) : undefined,
          isActive: Boolean(r.isActive ?? r.IsActive ?? true),
        }));
        setRoles(normalizedRoles);
        if (normalizedRoles.length > 0 && !selectedRoleID) {
          setSelectedRoleID(normalizedRoles[0].roleId);
        }
      }
    } catch (err) {
      setMessage({ text: normalizeApiError(err, "Failed to load roles."), type: "error" });
    }
  }, [selectedRoleID]);

  // Fetch Role Wise Menu Access Matrix for the selected role
  const fetchRoleAccess = useCallback(async (roleID: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/Admin/GetRoleWiseMenuAccess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ roleID }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : [];
        const normalized: MenuAccessItem[] = raw.map((item: Record<string, unknown>) => ({
          roleID: Number(item.roleID ?? item.RoleID ?? roleID),
          roleName: String(item.roleName ?? item.RoleName ?? ""),
          accessID: Number(item.accessID ?? item.AccessID ?? item.functionID ?? item.FunctionID ?? 0),
          functionID: Number(item.functionID ?? item.FunctionID ?? item.accessID ?? item.AccessID ?? 0),
          menuID: Number(item.menuID ?? item.MenuID ?? item.accessID ?? item.AccessID ?? 0),
          moduleID: Number(item.moduleID ?? item.ModuleID ?? 0),
          moduleName: String(item.moduleName ?? item.ModuleName ?? "General"),
          functionName: String(item.functionName ?? item.FunctionName ?? ""),
          menuName: String(item.menuName ?? item.MenuName ?? item.functionName ?? item.FunctionName ?? ""),
          navigationURL: String(item.navigationURL ?? item.NavigationURL ?? ""),
          displayOrder: Number(item.displayOrder ?? item.DisplayOrder ?? 0),
          isActive: Number(item.isActive ?? item.IsActive ?? 0),
        }));
        setMenuAccessList(normalized);
      } else {
        const err = await res.json();
        setMessage({ text: normalizeApiError(err, "Failed to load permissions."), type: "error" });
      }
    } catch (err) {
      setMessage({ text: normalizeApiError(err, "Failed to connect to backend API."), type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleID) {
      void fetchRoleAccess(selectedRoleID);
    }
  }, [selectedRoleID, fetchRoleAccess]);

  // Unique Modules
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    menuAccessList.forEach((m) => {
      if (m.moduleName) set.add(m.moduleName);
    });
    return Array.from(set).sort();
  }, [menuAccessList]);

  // Filtered lists
  const { availableList, assignedList } = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const matches = (item: MenuAccessItem) => {
      if (moduleFilter !== "ALL" && item.moduleName !== moduleFilter) {
        return false;
      }
      if (!term) return true;
      return (
        item.functionName.toLowerCase().includes(term) ||
        item.moduleName.toLowerCase().includes(term) ||
        String(item.accessID).includes(term) ||
        (item.navigationURL && item.navigationURL.toLowerCase().includes(term))
      );
    };

    const available = menuAccessList.filter((item) => item.isActive === 0 && matches(item));
    const assigned = menuAccessList.filter((item) => item.isActive === 1 && matches(item));

    return { availableList: available, assignedList: assigned };
  }, [menuAccessList, searchTerm, moduleFilter]);

  // Bulk Grant
  const handleBulkGrant = async () => {
    if (selectedAvailableIds.size === 0) return;
    setProcessing(true);
    const ids = Array.from(selectedAvailableIds);

    try {
      const promises = ids.map((menuID) =>
        fetch(`${getApiBaseUrl()}/api/Admin/GrantOrRevokeRoleWiseMenuAccess`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          credentials: "include",
          body: JSON.stringify({ roleID: selectedRoleID, menuID, isActive: 1 }),
        })
      );
      await Promise.all(promises);
      const grantIdSet = new Set(ids);
      setMenuAccessList((prev) =>
        prev.map((item) =>
          grantIdSet.has(item.accessID) && item.roleID === selectedRoleID
            ? { ...item, isActive: 1 }
            : item
        )
      );
      await refreshPermissions();
      setSelectedAvailableIds(new Set());
      setMessage({ text: `Granted ${ids.length} function(s) successfully.`, type: "success" });
    } catch (err) {
      setMessage({ text: normalizeApiError(err, "Failed to grant permissions."), type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  // Bulk Revoke
  const handleBulkRevoke = async () => {
    if (selectedAssignedIds.size === 0) return;
    setProcessing(true);
    const ids = Array.from(selectedAssignedIds);
    try {
      const promises = ids.map((menuID) =>
        fetch(`${getApiBaseUrl()}/api/Admin/GrantOrRevokeRoleWiseMenuAccess`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          credentials: "include",
          body: JSON.stringify({ roleID: selectedRoleID, menuID, isActive: 0 }),
        })
      );
      await Promise.all(promises);
      const revokeIdSet = new Set(ids);
      setMenuAccessList((prev) =>
        prev.map((item) =>
          revokeIdSet.has(item.accessID) && item.roleID === selectedRoleID
            ? { ...item, isActive: 0 }
            : item
        )
      );
      await refreshPermissions();
      setSelectedAssignedIds(new Set());
      setMessage({ text: `Revoked ${ids.length} function(s) successfully.`, type: "success" });
    } catch (err) {
      setMessage({ text: normalizeApiError(err, "Failed to revoke permissions."), type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  // Single Item Action
  const handleToggleSingle = async (item: MenuAccessItem, grant: boolean) => {
    setProcessing(true);
    const nextStatus = grant ? 1 : 0;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/Admin/GrantOrRevokeRoleWiseMenuAccess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          roleID: selectedRoleID,
          menuID: item.accessID,
          isActive: nextStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMenuAccessList((prev) =>
          prev.map((m) => {
            if (m.roleID === selectedRoleID && m.accessID === item.accessID) {
              return { ...m, isActive: nextStatus };
            }
            return m;
          })
        );
        await refreshPermissions();
        setMessage({
          text: `Function "${item.functionName}" ${grant ? "granted" : "revoked"} successfully.`,
          type: "success",
        });
      } else {
        setMessage({ text: normalizeApiError(data, "Failed to update permission."), type: "error" });
      }
    } catch (err) {
      setMessage({ text: normalizeApiError(err, "Operation failed."), type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const selectedRole = roles.find((r) => r.roleId === selectedRoleID);
  const totalFunctions = menuAccessList.length;
  const assignedCount = menuAccessList.filter((m) => m.isActive === 1).length;
  const availableCount = totalFunctions - assignedCount;

  return (
    <AuthGuardAccess requiredPermission={ACCESS_ID.ROLE_ACCESS}>
      <PageShell>
        {/* Top Dark Header Banner */}
        <DarkPageHeader
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          breadcrumbs={["Administration", "Role Permissions"]}
          pageTitle="Role-Wise Menu Access"
          description="Grant or revoke module and screen permissions for each user role"
          onRefresh={() => fetchRoleAccess(selectedRoleID)}
          isRefreshing={loading || processing}
        />

        {/* Top Stat Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-xs text-xs">
          <div className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Functions</span>
            <span className="font-bold text-sm text-blue-600">{totalFunctions}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Assigned</span>
            <span className="font-bold text-sm text-emerald-600">{assignedCount}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-md bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Available</span>
            <span className="font-bold text-sm text-blue-700">{availableCount}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-md bg-purple-50/60 border border-purple-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Role</span>
            <span className="font-bold text-xs text-purple-700 truncate max-w-[120px]" title={selectedRole?.roleName}>
              {selectedRole?.roleName || "—"}
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-xs space-y-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Role</label>
              <select
                value={selectedRoleID}
                onChange={(e) => {
                  const newId = Number(e.target.value);
                  setSelectedRoleID(newId);
                  setSelectedAvailableIds(new Set());
                  setSelectedAssignedIds(new Set());
                }}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-md text-xs font-medium bg-white text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={`role-opt-${r.roleId}`} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Filter by Module</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-md text-xs bg-white text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Modules</option>
                {availableModules.map((m) => (
                  <option key={`module-opt-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Search Function</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID, name, URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 border border-slate-300 rounded-md text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Role: <strong className="text-slate-900">{selectedRole?.roleName}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Module: <strong className="text-slate-900">{moduleFilter === "ALL" ? "All Modules" : moduleFilter}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Available: {availableList.length}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Assigned: {assignedList.length}
            </span>
          </div>
        </div>

        {/* Status Message Alert */}
        {message && (
          <AppAlert
            variant={message.type === "success" ? "success" : "error"}
            message={message.text}
            onDismiss={() => setMessage(null)}
          />
        )}

        {/* Dual-Pane Available vs Assigned Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {/* LEFT PANE: Available Functions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-slate-50/90 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xs text-slate-900">Available Functions</h3>
                <p className="text-[10px] text-slate-500">Not yet granted to &quot;{selectedRole?.roleName}&quot;.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {availableList.length} Available
                </span>
                {selectedAvailableIds.size > 0 && (
                  <button
                    onClick={handleBulkGrant}
                    disabled={processing}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Grant Selected ({selectedAvailableIds.size})
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-[10.5px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-1.5 px-2 w-7 text-center">
                      <input
                        type="checkbox"
                        checked={availableList.length > 0 && selectedAvailableIds.size === availableList.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAvailableIds(new Set(availableList.map((i) => i.accessID)));
                          } else {
                            setSelectedAvailableIds(new Set());
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-1.5 px-2">Module</th>
                    <th className="py-1.5 px-2">Function Name</th>
                    <th className="py-1.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Loading available functions...
                      </td>
                    </tr>
                  ) : availableList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No available functions to grant.
                      </td>
                    </tr>
                  ) : (
                    availableList.map((item) => {
                      const isChecked = selectedAvailableIds.has(item.accessID);
                      return (
                        <tr
                          key={`avail-${item.accessID}`}
                          className={`hover:bg-slate-50 transition-colors ${isChecked ? "bg-blue-50/40" : ""}`}
                        >
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedAvailableIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(item.accessID)) {
                                    next.delete(item.accessID);
                                  } else {
                                    next.add(item.accessID);
                                  }
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2 whitespace-nowrap text-slate-600 font-medium">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px]">
                              {item.moduleName}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="font-semibold text-slate-900 leading-tight">{item.functionName}</div>
                            {item.navigationURL && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{item.navigationURL}</div>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleToggleSingle(item, true)}
                              disabled={processing}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5 stroke-[3]" />
                              Grant
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT PANE: Assigned Functions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-slate-50/90 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-xs text-slate-900">Assigned Functions</h3>
                <p className="text-[10px] text-slate-500">Currently granted to &quot;{selectedRole?.roleName}&quot;.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  {assignedList.length} Assigned
                </span>
                {selectedAssignedIds.size > 0 && (
                  <button
                    onClick={handleBulkRevoke}
                    disabled={processing}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Revoke Selected ({selectedAssignedIds.size})
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-[10.5px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-1.5 px-2 w-7 text-center">
                      <input
                        type="checkbox"
                        checked={assignedList.length > 0 && selectedAssignedIds.size === assignedList.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignedIds(new Set(assignedList.map((i) => i.accessID)));
                          } else {
                            setSelectedAssignedIds(new Set());
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-1.5 px-2">Module</th>
                    <th className="py-1.5 px-2">Function Name</th>
                    <th className="py-1.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Loading assigned functions...
                      </td>
                    </tr>
                  ) : assignedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No functions assigned to this role.
                      </td>
                    </tr>
                  ) : (
                    assignedList.map((item) => {
                      const isChecked = selectedAssignedIds.has(item.accessID);
                      return (
                        <tr
                          key={`assigned-${item.accessID}`}
                          className={`hover:bg-slate-50 transition-colors ${isChecked ? "bg-rose-50/40" : ""}`}
                        >
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedAssignedIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(item.accessID)) {
                                    next.delete(item.accessID);
                                  } else {
                                    next.add(item.accessID);
                                  }
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2 whitespace-nowrap text-slate-600 font-medium">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px]">
                              {item.moduleName}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="font-semibold text-slate-900 leading-tight">{item.functionName}</div>
                            {item.navigationURL && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{item.navigationURL}</div>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleToggleSingle(item, false)}
                              disabled={processing}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5 stroke-[2.5]" />
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageShell>
    </AuthGuardAccess>
  );
}
