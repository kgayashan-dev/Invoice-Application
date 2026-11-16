"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCheck,
  History,
  Settings,
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  Building2,
  Receipt,
  PanelLeftClose,
  ShieldCheck,
  FolderKey,
  Menu,
  X,
} from "lucide-react";
import { usePermissions } from "@/Contexts/PermissionContext";
import { useSidebar } from "@/Contexts/SidebarContext";
import { getInitials } from "@/utils/auth";
import { logout } from "@/app/login/action";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  accessId?: number;
  displayOrder?: number;
}

interface NavGroup {
  sectionTitle?: string;
  items: NavItem[];
}

function getIconForFunction(href: string, funcId: number): React.ReactNode {
  if (href === "/main" || href === "/main/dashboard" || funcId === 1001) return <LayoutDashboard className="w-4 h-4" />;
  if (href === "/main/users" || funcId === 1002) return <Users className="w-4 h-4" />;
  if (href === "/main/admin/role-access" || funcId === 1004) return <ShieldCheck className="w-4 h-4" />;
  if (href === "/main/admin/roles" || funcId === 1008) return <Shield className="w-4 h-4" />;
  if (href === "/main/admin/assign-roles" || funcId === 1005) return <UserCheck className="w-4 h-4" />;
  if (href === "/main/audit" || funcId === 2001) return <History className="w-4 h-4" />;
  if (href === "/main/settings" || funcId === 3001) return <Settings className="w-4 h-4" />;
  if (href === "/main/invoices" || funcId === 8001) return <FileText className="w-4 h-4" />;
  return <FolderKey className="w-4 h-4" />;
}

interface SidebarProps {
  fullName: string;
  userName: string;
  role: string;
}

export default function Sidebar({ fullName, userName, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { permissions, loading, hasPermission } = usePermissions();
  const { isSidebarHidden, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();

  const [userToggledSections, setUserToggledSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string, currentlyExpanded: boolean) => {
    setUserToggledSections((prev) => ({
      ...prev,
      [title]: !currentlyExpanded,
    }));
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logout();
      router.replace("/login");
    }
  };

  const navGroups = useMemo<NavGroup[]>(() => {
    const groups: NavGroup[] = [];

    // Dashboard
    if (hasPermission(1001)) {
      groups.push({
        items: [
          {
            label: "Dashboard",
            href: "/main/dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            accessId: 1001,
            displayOrder: 1,
          },
        ],
      });
    }

    if (!permissions || permissions.length === 0) {
      return groups;
    }

    // Group by Module
    const moduleMap = new Map<string, NavItem[]>();

    permissions
      .filter((p) => p.FunctionID !== 1001 && p.NavigationURL)
      .forEach((p) => {
        const mod = p.Module || "Administration";
        if (!moduleMap.has(mod)) {
          moduleMap.set(mod, []);
        }
        moduleMap.get(mod)!.push({
          label: p.FunctionName,
          href: p.NavigationURL!,
          icon: getIconForFunction(p.NavigationURL!, p.FunctionID),
          accessId: p.FunctionID,
          displayOrder: p.DisplayOrder,
        });
      });

    // Ensure preferred section order
    const SECTION_ORDER = ["Billing", "Invoicing", "Administration", "Settings", "Security"];
    const sortedSections = Array.from(moduleMap.entries()).sort(([a], [b]) => {
      const idxA = SECTION_ORDER.findIndex((s) => a.toLowerCase().includes(s.toLowerCase()));
      const idxB = SECTION_ORDER.findIndex((s) => b.toLowerCase().includes(s.toLowerCase()));
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    for (const [sectionTitle, items] of sortedSections) {
      items.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
      groups.push({ sectionTitle, items });
    }

    return groups;
  }, [permissions, hasPermission]);

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0 bg-white text-slate-800 border-r border-slate-200 select-none shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs text-white">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Invoice<span className="text-blue-600">Enterprise</span>
          </span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Hide Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* User profile banner */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
            {getInitials(fullName || userName || "U")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
              {fullName || userName}
            </p>
            <p className="text-[11px] text-slate-500 truncate capitalize leading-tight mt-0.5">
              {role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 min-h-0 px-2 py-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {loading && navGroups.length <= 1 ? (
          <div className="space-y-2 px-2 py-2">
            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-20" />
            <div className="h-7 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : (
          navGroups.map((group, gIdx) => {
            const hasSectionTitle = Boolean(group.sectionTitle);
            const isAutoExpanded = group.items.some(
              (item) => pathname === item.href || (item.href !== "/main" && pathname.startsWith(item.href))
            );
            const isExpanded = userToggledSections[group.sectionTitle || ""] ?? (isAutoExpanded || true);

            return (
              <div key={gIdx} className="pt-1.5 first:pt-0">
                {hasSectionTitle && (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.sectionTitle!, isExpanded)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors group"
                  >
                    <span className="truncate">{group.sectionTitle}</span>
                    <span className="text-slate-300 group-hover:text-slate-500">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                )}

                {(!hasSectionTitle || isExpanded) && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item, iIdx) => {
                      const isActive =
                        item.href === "/main/dashboard" || item.href === "/main"
                          ? pathname === "/main/dashboard" || pathname === "/main"
                          : pathname === item.href || pathname.startsWith(item.href + "/");

                      return (
                        <Link
                          key={iIdx}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                        >
                          <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            IE
          </div>
          <span className="font-bold text-slate-900 text-sm">Invoice Enterprise</span>
        </div>
        <button
          onClick={() => setMobileOpen(!isMobileOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        />
      )}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full transition-all duration-200 ease-in-out ${
          isSidebarHidden ? "w-0 overflow-hidden border-none" : "w-56 lg:w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
