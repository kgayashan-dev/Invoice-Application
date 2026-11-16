namespace backend.Models;

public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerAddress { get; set; }
    public string? Attention { get; set; }
    public string? CustomerId { get; set; }
    public string? CustomerTin { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);
    public string Status { get; set; } = "Pending"; // Draft, Pending, Awaiting Signature, Signed & Ready, Paid, Cancelled
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "LKR";
    public string? Notes { get; set; }
    public string? SignedBy { get; set; }
    public DateTime? SignedAt { get; set; }
    public string? SignatureData { get; set; }
    public string? FinanceReviewNotes { get; set; }
    public int? LogoId { get; set; }
    public int? SignatureId { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankSwiftCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
