// utils/notifications.ts
// Handles API calls, fetching, and marking notifications

import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";

export interface NotificationItem {
  id: number;
  notificationId: number;
  userId: string;
  targetRole?: string | null;
  senderUser?: string | null;
  title: string;
  message: string;
  notificationType: string;
  referenceId?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationResult {
  success: boolean;
  items: NotificationItem[];
  unreadCount: number;
}

export async function fetchUserNotifications(): Promise<NotificationResult> {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/Notifications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, items: [], unreadCount: 0 };
    }

    const data = await res.json();
    return {
      success: true,
      items: Array.isArray(data.items) ? data.items : [],
      unreadCount: Number(data.unreadCount ?? 0),
    };
  } catch (err) {
    console.error("[notifications] Failed to fetch notifications:", err);
    return { success: false, items: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/Notifications/${id}/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/Notifications/read-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}
