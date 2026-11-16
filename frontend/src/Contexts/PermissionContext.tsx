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
  hasPermission: () => false,
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
      } else {
        // If unauthorized or failed, clear permissions
        setPermissions([]);
        if (typeof window !== "undefined") {
          localStorage.removeItem("userPermissions");
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
    const handlePermissionsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SystemFunctionAccess[]>;
      if (customEvent.detail) {
        setPermissions(customEvent.detail);
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "userPermissions") {
        if (!e.newValue) {
          setPermissions([]);
        } else {
          try {
            setPermissions(JSON.parse(e.newValue));
          } catch {
            setPermissions([]);
          }
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadPermissions]);

  const hasPermission = (permissionId: number): boolean => {
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
