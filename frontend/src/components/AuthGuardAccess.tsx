"use client";

import { usePermissions } from "@/Contexts/PermissionContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function AuthGuardAccess({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission: number | number[];
}) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAllowed = Array.isArray(requiredPermission)
    ? requiredPermission.some((p) => hasPermission(p))
    : hasPermission(requiredPermission);

  const displayPermission = Array.isArray(requiredPermission)
    ? requiredPermission.join(" / ")
    : requiredPermission;

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-xl shadow-xs border border-slate-200 max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          You do not have authorization to view this feature (Access ID:{" "}
          <span className="font-mono font-semibold text-slate-800">{displayPermission}</span>).
          Please contact your system administrator to assign the necessary role or permission.
        </p>
        {hasPermission(1001) ? (
          <Link
            href="/main/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        ) : (
          <p className="text-xs text-slate-500 font-medium">
            Please choose an authorized module from the sidebar navigation.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
