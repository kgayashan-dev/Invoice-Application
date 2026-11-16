"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  History,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Building2
} from "lucide-react";
import { useSidebar } from "@/Contexts/SidebarContext";
import { getInitials } from "@/utils/auth";
import { logout } from "@/app/login/action";

interface SidebarProps {
  fullName: string;
  userName: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  sectionTitle?: string;
  items: NavItem[];
}

export default function Sidebar({ fullName, userName, role }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  const navGroups: NavGroup[] = [
    {
      sectionTitle: "Overview",
      items: [
        { label: "Dashboard", href: "/main", icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      sectionTitle: "Invoicing",
      items: [
        { label: "Invoices", href: "/main/invoices", icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      sectionTitle: "Administration",
      items: [
        { label: "Users", href: "/main/users", icon: <Users className="w-5 h-5" /> },
        { label: "User Roles", href: "/main/admin/roles", icon: <Shield className="w-5 h-5" /> },
        { label: "Assign Roles", href: "/main/admin/assign-roles", icon: <UserCheck className="w-5 h-5" /> },
        { label: "Audit Trail", href: "/main/audit", icon: <History className="w-5 h-5" /> },
        { label: "Settings", href: "/main/settings", icon: <Settings className="w-5 h-5" /> },
      ],
    },
  ];

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
            IA
          </div>
          <span className="font-bold text-white text-sm">Invoice App</span>
        </div>
        <button
          onClick={() => setMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20 shrink-0">
              IA
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-sm truncate tracking-tight">Invoice Enterprise</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Administration</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && group.sectionTitle && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.sectionTitle}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/50">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                {getInitials(fullName || userName)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-white truncate">{fullName || userName}</span>
                  <span className="text-[10px] text-indigo-400 font-medium truncate">{role}</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
