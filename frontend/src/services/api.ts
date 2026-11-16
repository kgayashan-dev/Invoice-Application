import { Invoice, HealthCheckResponse } from "@/types/invoice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5038";

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to check health: ${res.statusText}`);
  }
  return res.json();
}

export async function getInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE_URL}/api/invoices`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch invoices: ${res.statusText}`);
  }
  return res.json();
}

export async function getInvoice(id: number): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice #${id}: ${res.statusText}`);
  }
  return res.json();
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/api/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(invoice),
  });
  if (!res.ok) {
    throw new Error(`Failed to create invoice: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteInvoice(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete invoice #${id}: ${res.statusText}`);
  }
}
