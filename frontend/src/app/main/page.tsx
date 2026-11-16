"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/Contexts/PermissionContext";
import { ACCESS_ID } from "@/utils/access";
import LoadingState from "@/components/feedback/LoadingState";

export default function MainPage() {
  const router = useRouter();
  const { hasPermission, permissions, loading } = usePermissions();

  useEffect(() => {
    if (loading) return;

    // If user has Dashboard permission (1001), route to /main/dashboard
    if (hasPermission(ACCESS_ID.DASHBOARD)) {
      router.replace("/main/dashboard");
      return;
    }

    // If Dashboard permission is revoked, intelligently redirect to the first permitted page
    const firstPermitted = permissions.find((p) => {
      const url = (p.NavigationURL || p.URL || "").trim().toLowerCase();
      return url && url !== "/main" && url !== "/main/dashboard" && url !== "#";
    });

    if (firstPermitted) {
      router.replace(firstPermitted.NavigationURL || firstPermitted.URL || "/main/dashboard");
    } else {
      router.replace("/main/dashboard");
    }
  }, [loading, hasPermission, permissions, router]);

  return <LoadingState label="Redirecting to your workspace..." minHeight="min-h-[250px]" />;
}
