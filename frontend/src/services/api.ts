import { Invoice, HealthCheckResponse } from "@/types/invoice";
import { AppAsset } from "@/types/asset";
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
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to create invoice: ${res.statusText}`);
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
  signatureData?: string,
  signatureId?: number
): Promise<{ success: boolean; message: string; signedBy: string }> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ signatureData, signatureId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to sign invoice: ${res.statusText}`);
  }
  return res.json();
}

// ────────────────────────────────────────────────────────────────────────────
// ASSETS API (LOGOS & SIGNATURES)
// ────────────────────────────────────────────────────────────────────────────

export async function getAssets(type?: "Logo" | "Signature" | string): Promise<AppAsset[]> {
  const apiUrl = getApiBaseUrl();
  const url = type ? `${apiUrl}/api/assets?type=${encodeURIComponent(type)}` : `${apiUrl}/api/assets`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch assets: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadAsset(dto: {
  assetType: "Logo" | "Signature" | string;
  name: string;
  fileName: string;
  contentType: string;
  imageData: string;
  isDefault?: boolean;
}): Promise<{ id: number; message: string; assetType: string; name: string }> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/assets/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to upload ${dto.assetType}: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/assets/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete asset #${id}: ${res.statusText}`);
  }
}

export async function setDefaultAsset(id: number, assetType: string): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/assets/${id}/set-default?assetType=${encodeURIComponent(assetType)}`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to set asset as default: ${res.statusText}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PDF & EXCEL REPORT GENERATION DOWNLOADS
// ────────────────────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(
  id: number,
  options?: { logoId?: number; signatureId?: number },
  customFileName?: string
): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(options || {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to generate PDF: ${res.statusText}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = customFileName || `Invoice_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadInvoiceExcel(id: number, customFileName?: string): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/${id}/export-excel`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to export Excel: ${res.statusText}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = customFileName || `Invoice_${id}_Particulars.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadAllInvoicesExcel(): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/invoices/export-report-excel`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to export Invoices report: ${res.statusText}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoices_Particulars_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
