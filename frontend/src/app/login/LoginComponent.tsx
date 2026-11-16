"use client";

import { FormEvent, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Receipt,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  Building2,
  History,
} from "lucide-react";
import { login } from "@/app/login/action";
import { getStoredUser } from "@/utils/auth";

function InvoiceAppEmblem({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Invoice Application Emblem"
    >
      <circle cx="60" cy="60" r="56" fill="url(#crestGlow)" opacity="0.15" />
      <path
        d="M32 45C30 55 33 67 40 76C44 81 50 87 58 90"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M26 48C30 49 32 46 32 45" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 58C29 58 31 55 33 53" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 68C32 67 34 64 36 62" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 78C38 76 39 72 41 70" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M43 86C46 83 48 79 50 77" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M88 45C90 55 87 67 80 76C76 81 70 87 62 90"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M94 48C90 49 88 46 88 45" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 58C91 58 89 55 87 53" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M92 68C88 67 86 64 84 62" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M86 78C82 76 81 72 79 70" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M77 86C74 83 72 79 70 77" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M60 16L84 26C84 52 75 74 60 84C45 74 36 52 36 26L60 16Z"
        fill="url(#shieldGrad)"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 21L80 29.5C80 50 72 69 60 78C48 69 40 50 40 29.5L60 21Z"
        fill="#071b42"
        stroke="#F59E0B"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.8"
      />
      <polygon points="60,26 62,31 67,31 63,34 65,39 60,36 55,39 57,34 53,31 58,31" fill="#FBBF24" />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fill="url(#goldTextGrad)"
        fontSize="20"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        IA
      </text>

      <defs>
        <radialGradient id="crestGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shieldGrad" x1="60" y1="16" x2="60" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0E3A7E" />
          <stop offset="100%" stopColor="#061838" />
        </linearGradient>
        <linearGradient id="goldTextGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FDE68A" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const INVOICE_FEATURES = [
  {
    icon: Receipt,
    title: "Invoice Generation",
    desc: "Create and track customer billings with automated line items",
  },
  {
    icon: DollarSign,
    title: "Financial Tracking",
    desc: "Real-time receivables, status cycles, and settlement telemetry",
  },
  {
    icon: Users,
    title: "User Administration",
    desc: "Full operator provisioning with lock and unlock protection",
  },
  {
    icon: ShieldCheck,
    title: "Role & Permission RBAC",
    desc: "Fine-grained system roles and menu access security",
  },
  {
    icon: History,
    title: "Complete Audit Trail",
    desc: "Immutable change logs with operator, IP, and action tracking",
  },
  {
    icon: Building2,
    title: "System Settings",
    desc: "Enterprise environment and billing threshold configuration",
  },
];

export default function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const getPostLoginUrl = useCallback(() => {
    const returnUrl = searchParams.get("returnUrl");

    // Only allow local application routes as post-login destinations.
    return returnUrl?.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : "/main/dashboard";
  }, [searchParams]);

  const performLogin = useCallback(
    async (u: string, p: string) => {
      if (!u.trim() || !p) {
        setError("Please enter both user name and password.");
        return;
      }
      setIsLoading(true);
      setError("");

      try {
        const result = await login(u.trim(), p);

        const rawUsers = result.data?.user || (result.data as Record<string, unknown>)?.User;
        const userObj = Array.isArray(rawUsers) ? rawUsers[0] : (rawUsers || result.data);

        if (result.success && userObj) {
          const user = userObj as Record<string, unknown>;

          const fullName = String(
            user.FullName ||
            user.fullName ||
            user.DisplayName ||
            user.displayName ||
            u.trim()
          );
          const userName = String(
            user.UserName ||
            user.userName ||
            u.trim()
          );
          const loginId = String(
            user.loginID ||
            user.LoginID ||
            ""
          );
          const roleName = String(
            user.RoleName ||
            user.roleName ||
            (userName.toLowerCase() === "admin" ? "System Administrator" : "User")
          );

          const isLocked = Boolean(
            user.IsLockedPermanently ||
            user.isLockedPermanently ||
            user.IsLockedOut ||
            user.isLockedOut
          );

          if (isLocked) {
            setError(
              String(user.LoginMessage || user.loginMessage || "Your account is locked. Please contact the administrator.")
            );
            setIsLoading(false);
            return;
          }

          // Clear stale session
          localStorage.removeItem("FullName");
          localStorage.removeItem("UserName");
          localStorage.removeItem("loginID");
          localStorage.removeItem("token");
          localStorage.removeItem("RoleName");
          localStorage.removeItem("userPermissions");

          // Set active user session
          localStorage.setItem("FullName", fullName);
          localStorage.setItem("UserName", userName);
          localStorage.setItem("token", userName);
          localStorage.setItem("RoleName", roleName);
          if (loginId) localStorage.setItem("loginID", loginId);

          const targetUrl = getPostLoginUrl();
          console.log(`[Login] Success. Redirecting to ${targetUrl}`);
          window.location.href = targetUrl;
          return;
        } else {
          setError(result.error || "Login failed. Please check your credentials.");
        }
      } catch (err) {
        setError(`Unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [getPostLoginUrl]
  );

  useEffect(() => {
    // 1. If already authenticated locally, route straight to dashboard
    const user = getStoredUser();
    if (user && (user.userName || user.fullName)) {
      window.location.href = getPostLoginUrl();
      return;
    }

    // 2. If browser has ?username=...&password=... from form GET submission, auto-login immediately
    const queryUser = searchParams.get("username");
    const queryPass = searchParams.get("password");
    if (queryUser && queryPass) {
      setUsername(queryUser);
      setPassword(queryPass);
      void performLogin(queryUser, queryPass);
    }
  }, [getPostLoginUrl, searchParams, performLogin]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    await performLogin(username, password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081e48] selection:bg-cyan-500 selection:text-white">
      {/* LEFT PANEL: Hero & Invoicing Capabilities Showcase */}
      <section className="w-full lg:w-[58%] xl:w-[60%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#0c316f] via-[#092353] to-[#04122d]">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8 lg:space-y-10">
          {/* Brand Mark Pill Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/20 shadow-xl shadow-cyan-950/40">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-400/40 text-white font-black text-xs tracking-wider">
                IE
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-widest text-white uppercase font-sans">
                  Invoice Enterprise
                </span>
                <span className="text-[10px] tracking-wider text-cyan-300 font-semibold uppercase -mt-0.5">
                  Billing & Administration Suite
                </span>
              </div>
            </div>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.2em] text-cyan-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Enterprise Financial & Administration Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
              One platform for all your billing & administration operations
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
              Built for modern businesses: invoice management, customer receivables, user security,
              role-based permissions, and immutable audit logs on one secure core.
            </p>
          </div>

          {/* Capability Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-2">
            {INVOICE_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`feature-${item.title}`}
                  className="bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] rounded-2xl p-3.5 backdrop-blur-md transition-all duration-200 flex items-center gap-3.5 group shadow-sm hover:shadow-cyan-950/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-300 group-hover:scale-105 group-hover:bg-cyan-500/25 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-cyan-200 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-blue-200/70 truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Panel Footer: Security Pillars */}
        <div className="relative z-10 pt-8 lg:pt-10 border-t border-white/10 mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-blue-200/90 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Role-based access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stored Procedure ADO.NET security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full audit trail telemetry</span>
            </div>
          </div>
          <p className="text-[11px] text-blue-300/60 font-normal">
            &copy; 2026 Invoice Enterprise. All rights reserved.
          </p>
        </div>
      </section>

      {/* RIGHT PANEL: Sign-in Form Card */}
      <section className="w-full lg:w-[42%] xl:w-[40%] flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 bg-slate-100/90 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md bg-white rounded-[28px] p-8 sm:p-10 shadow-2xl shadow-slate-300/70 border border-slate-200/80 relative">
          {/* Emblem Crest */}
          <div className="flex justify-center -mt-2 mb-4">
            <InvoiceAppEmblem className="w-20 h-20 drop-shadow-md hover:scale-105 transition-transform duration-300" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Use your operator user name and password.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form
            className="space-y-4"
            action="#"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void performLogin(username, password);
            }}
          >
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                User name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Your user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      void performLogin(username, password);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/30 focus:border-[#0088cc] disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      void performLogin(username, password);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/30 focus:border-[#0088cc] disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => void performLogin(username, password)}
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#0088cc] hover:bg-[#0077b6] active:scale-[0.99] shadow-md shadow-[#0088cc]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] sm:text-xs text-slate-500 pt-1 leading-normal">
              Forgot your password or locked out? Contact your system administrator.
            </p>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Authorised users only. Sign-in attempts are recorded.</span>
        </div>
      </section>
    </div>
  );
}
