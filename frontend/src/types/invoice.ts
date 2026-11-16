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
  customerEmail?: string | null;
  customerAddress?: string | null;
  attention?: string | null;
  customerId?: string | null;
  customerTin?: string | null;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Pending' | 'Awaiting Signature' | 'Signed & Ready' | 'Paid' | 'Overdue' | 'Cancelled' | string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  signatureData?: string | null;
  financeReviewNotes?: string | null;
  currency?: string | null;
  logoId?: number | null;
  signatureId?: number | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankSwiftCode?: string | null;
  createdAt?: string;
  items: InvoiceItem[];
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  error?: string | null;
  timestamp: string;
}
