"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, useState } from "react";

interface SidebarContextType {
  isSidebarHidden: boolean;
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarHidden: false,
  toggleSidebar: () => {},
  setSidebarHidden: () => {},
  isCollapsed: false,
  toggleCollapsed: () => {},
  isMobileOpen: false,
  setMobileOpen: () => {},
});

const SIDEBAR_STORAGE_KEY = "sidebar_hidden";
const SIDEBAR_EVENT = "sidebar_hidden_change";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isSidebarHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const setSidebarHidden = useCallback((hidden: boolean) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(hidden));
      window.dispatchEvent(new Event(SIDEBAR_EVENT));
    } catch {
      // Ignore localStorage write errors in private mode
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarHidden(!getSnapshot());
  }, [setSidebarHidden]);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarHidden,
        toggleSidebar,
        setSidebarHidden,
        isCollapsed: isSidebarHidden,
        toggleCollapsed: toggleSidebar,
        isMobileOpen,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
