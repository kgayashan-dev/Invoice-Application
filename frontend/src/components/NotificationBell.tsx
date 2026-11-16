"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import {
  NotificationItem,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/utils/notifications";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetchUserNotifications();
      if (res.success) {
        setNotifications(res.items);
        setUnreadCount(res.unreadCount);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    // Poll every 20 seconds for new notifications
    const interval = setInterval(() => {
      void loadNotifications();
    }, 20000);

    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("notificationsUpdated", loadNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("notificationsUpdated", loadNotifications);
    };
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationAsRead(item.id || item.notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setIsOpen(false);

    if (item.referenceId && item.referenceId.startsWith("INV-")) {
      router.push(`/main/invoices?search=${encodeURIComponent(item.referenceId)}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500/80 text-white text-[10px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                <p className="text-xs font-medium">No notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isSignatureReq = item.notificationType === "InvoiceSignatureRequest";
                const isSigned = item.notificationType === "InvoiceSigned";

                return (
                  <div
                    key={item.id || item.notificationId}
                    onClick={() => handleMarkAsRead(item)}
                    className={`p-3 text-xs transition-colors cursor-pointer flex gap-2.5 items-start ${
                      item.isRead
                        ? "bg-white hover:bg-slate-50 text-slate-600"
                        : "bg-blue-50/50 hover:bg-blue-50/80 text-slate-900 font-medium"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSignatureReq ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      ) : isSigned ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate text-[11px]">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {item.senderUser && (
                          <span>From: @{item.senderUser}</span>
                        )}
                        {item.priority === "HIGH" && (
                          <span className="text-amber-600 font-semibold">• High Priority</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Real-time invoicing & signature requests
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
