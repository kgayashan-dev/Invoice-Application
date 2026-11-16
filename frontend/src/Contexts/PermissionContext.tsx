"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getApiBaseUrl } from "@/app/login/action";

export interface MenuItem {
  FunctionID: number;
  FunctionName: string;
  NavigationURL: string;
  DisplayOrder?: number;
  Module?: string;
}

interface PermissionContextType {
  permissions: MenuItem[];
  hasPermission: (functionId: number) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => true,
  loading: false,
  refreshPermissions: async () => {},
});

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async () => {
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/Auth/GetMenuID`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(Array.isArray(data) ? data : []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const hasPermission = (functionId: number): boolean => {
    if (!permissions.length) return true;
    return permissions.some((p) => p.FunctionID === functionId);
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, loading, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};
