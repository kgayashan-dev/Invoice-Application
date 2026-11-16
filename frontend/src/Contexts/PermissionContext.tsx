// Contexts/PermissionContext.tsx
// Finnect Digital Architecture: User Permission Context Provider
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { loadAccessData, SystemFunctionAccess } from "@/utils/loadnavdata";

interface PermissionContextType {
  permissions: SystemFunctionAccess[];
  hasPermission: (permissionId: number) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => true, // default permissive before check
  loading: true,
  refreshPermissions: async () => {},
});

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<SystemFunctionAccess[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("userPermissions");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const loadPermissions = useCallback(async () => {
    try {
      const result = await loadAccessData();
      if (result.success && Array.isArray(result.data)) {
        setPermissions(result.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("userPermissions", JSON.stringify(result.data));
          window.dispatchEvent(new CustomEvent("permissionsUpdated", { detail: result.data }));
        }
      }
    } catch (err) {
      console.error("[PermissionContext] Exception during loadPermissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchPerms = async () => {
      if (!ignore) {
        await loadPermissions();
      }
    };
    void fetchPerms();
    return () => {
      ignore = true;
    };
  }, [pathname, loadPermissions]);

  useEffect(() => {
    const handleFocus = () => {
      void loadPermissions();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadPermissions]);

  const hasPermission = (permissionId: number): boolean => {
    if (!permissions.length) return true; // If permissions not loaded, allow access
    return permissions.some((perm) => {
      const p = perm as unknown as Record<string, unknown>;
      const id = p.FunctionID ?? p.functionID ?? p.AccessID ?? p.accessID;
      return Number(id) === Number(permissionId);
    });
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        hasPermission,
        loading,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
