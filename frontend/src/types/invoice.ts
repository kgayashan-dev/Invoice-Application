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
  status: 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  totalAmount: number;
  notes?: string;
  createdAt?: string;
  items: InvoiceItem[];
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  error?: string | null;
  timestamp: string;
}
