"use client";

import { useState, Suspense } from "react";
import AuthGuard from "@/components/AuthGuard";
import { PermissionProvider } from "@/Contexts/PermissionContext";
import { CurrencyProvider } from "@/Contexts/CurrencyContext";
import { SidebarProvider } from "@/Contexts/SidebarContext";
import Sidebar from "@/components/Sidebar";
import { getStoredUser, getUserRole } from "@/utils/auth";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [user] = useState(() => getStoredUser());

  const role = user?.roleName || getUserRole(user?.userName || "");

  return (
    <AuthGuard>
      <PermissionProvider>
        <CurrencyProvider>
          <SidebarProvider>
            <div className="fixed inset-0 flex overflow-hidden bg-slate-100">
              {/* Sidebar */}
              <Sidebar
                fullName={user?.fullName || ""}
                userName={user?.userName || ""}
                role={role}
              />

              {/* Main content viewport */}
              <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden transition-all duration-200 custom-scrollbar">
                <div className="md:hidden h-12 shrink-0" />
                <div className="flex-1 p-2 sm:p-3 lg:p-4 w-full max-w-none">
                  <Suspense
                    fallback={
                      <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                      </div>
                    }
                  >
                    {children}
                  </Suspense>
                </div>
              </main>
            </div>
          </SidebarProvider>
        </CurrencyProvider>
      </PermissionProvider>
    </AuthGuard>
  );
}
