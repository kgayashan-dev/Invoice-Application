export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Pending' | 'Awaiting Signature' | 'Signed & Ready' | 'Paid' | 'Overdue' | 'Cancelled' | string;
  totalAmount: number;
  notes?: string;
  signedBy?: string | null;
  signedAt?: string | null;
  signatureData?: string | null;
  financeReviewNotes?: string | null;
  currency?: string | null;
  createdAt?: string;
  items: InvoiceItem[];
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  error?: string | null;
  timestamp: string;
}
