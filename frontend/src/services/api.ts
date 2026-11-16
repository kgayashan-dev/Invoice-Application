import { Invoice, HealthCheckResponse } from "@/types/invoice";
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to check health: ${res.statusText}`);
  }
  return res.json();
}

export async function getInvoices(): Promise<Invoice[]> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch invoices: ${res.statusText}`);
  }
  return res.json();
}

export async function getInvoice(id: number): Promise<Invoice> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice #${id}: ${res.statusText}`);
  }
  return res.json();
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(invoice),
  });
  if (!res.ok) {
    throw new Error(`Failed to create invoice: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteInvoice(id: number): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete invoice #${id}: ${res.statusText}`);
  }
}

export async function requestInvoiceSignature(
  id: number,
  notes?: string
): Promise<{ success: boolean; message: string; invoiceNumber?: string }> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}/request-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to request signature: ${res.statusText}`);
  }
  return res.json();
}

export async function signInvoice(
  id: number,
  signatureData?: string
): Promise<{ success: boolean; message: string; signedBy: string }> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ signatureData }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to sign invoice: ${res.statusText}`);
  }
  return res.json();
}
