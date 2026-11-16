"use client";

import { useEffect, useState } from "react";
import { getStoredUser, clearStoredUser } from "@/utils/auth";
import { checkAuthentication } from "@/app/login/action";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const user = getStoredUser();

    if (!user || (!user.userName && !user.fullName)) {
      clearStoredUser();
      window.location.href = "/login";
      return;
    }

    // Immediately grant access if valid user data exists locally
    setIsAuthenticated(true);

    // Asynchronously ping backend to check session health without kicking out on transient errors
    checkAuthentication()
      .then((isAlive) => {
        if (!isMounted) return;
        if (!isAlive) {
          console.warn("[AuthGuard] Backend authentication status check failed.");
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          <p className="text-sm text-slate-400 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
