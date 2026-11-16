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
      window.location.replace("/login");
      return;
    }

    checkAuthentication()
      .then((isAlive) => {
        if (!isMounted) return;
        if (!isAlive) {
          clearStoredUser();
          setIsAuthenticated(false);
          window.location.replace("/login");
          return;
        }

        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!isMounted) return;
        // On network failure if user already has local credentials, keep session alive
        setIsAuthenticated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
