using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.Services;

public class InvoicePdfModel
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerAddress { get; set; }
    public string? Attention { get; set; }
    public string? CustomerId { get; set; }
    public string? CustomerTin { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "LKR";
    public string CurrencyPrefix { get; set; } = "Rs.";
    public string? Notes { get; set; }

    // Company Settings
    public string CompanyName { get; set; } = "FINNECT DIGITAL (PVT) LTD";
    public string CompanyAddress { get; set; } = "Basil's building, 5th floor, 340, 1/5, Galle Road Colombo 03.";
    public string CompanyPhone { get; set; } = "+94 711951111";
    public string CompanyEmail { get; set; } = "Inf@finnectdigital.lk";
    public string CompanyTin { get; set; } = "242770170";

    // Bank details
    public string BankAccountName { get; set; } = "FINNECT DIGITAL (PVT) LTD";
    public string BankAccountNumber { get; set; } = "1001084778";
    public string BankName { get; set; } = "Commercial Bank of Ceylon PLC – Kollupitiya Branch (7056 – 011)";
    public string BankSwiftCode { get; set; } = "CCEYLKLX";

    // Signature & Signatory
    public string? SignedBy { get; set; }
    public DateTime? SignedAt { get; set; }
    public byte[]? SignatureImageBytes { get; set; }
    public byte[]? LogoImageBytes { get; set; }

    public List<InvoicePdfItemModel> Items { get; set; } = new();
}

public class InvoicePdfItemModel
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public class QuestPdfInvoiceDocument : IDocument
{
    private readonly InvoicePdfModel _model;

    // Palette matching sample invoice 01.pdf
    private static readonly string PrimaryBlue = "#2E64A8";
    private static readonly string LightBlue = "#CFE2F3";
    private static readonly string ZebraBg = "#F8FAFC";
    private static readonly string BorderColor = "#CBD5E1";

    public QuestPdfInvoiceDocument(InvoicePdfModel model)
    {
        _model = model;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(32);
            page.DefaultTextStyle(x => x.FontFamily("Lato").FontSize(9).FontColor("#1E293B"));

            page.Content().Column(col =>
            {
                // 1. Header with Company Details (Left) and Logo (Right)
                col.Item().Row(row =>
                {
                    row.RelativeItem(3).Column(c =>
                    {
                        c.Item().Text(_model.CompanyName).Bold().FontSize(12).FontColor("#0F172A");
                        c.Item().Text(_model.CompanyAddress).FontSize(8.5f).FontColor("#475569");
                        c.Item().Text($"Tel. {_model.CompanyPhone}  {_model.CompanyEmail}").FontSize(8.5f).FontColor("#475569");
                        c.Item().Text($"TIN No. {_model.CompanyTin}").FontSize(8.5f).FontColor("#475569");
                    });

                    row.RelativeItem(2).AlignRight().AlignMiddle().Element(c =>
                    {
                        if (_model.LogoImageBytes != null && _model.LogoImageBytes.Length > 0)
                        {
                            try
                            {
                                c.MaxHeight(55).MaxWidth(140).Image(_model.LogoImageBytes);
                            }
                            catch
                            {
                                c.Text(_model.CompanyName).Bold().FontSize(11).FontColor(PrimaryBlue);
                            }
                        }
                        else
                        {
                            c.Text(_model.CompanyName).Bold().FontSize(11).FontColor(PrimaryBlue);
                        }
                    });
                });

                // 2. Centered INVOICE Title
                col.Item().PaddingVertical(14).AlignCenter().Text("INVOICE")
                    .Bold().FontSize(22).FontColor(PrimaryBlue);

                // 3. Bill To (Left) & Invoice Meta Table (Right)
                col.Item().Row(row =>
                {
                    // Left Column: BILL TO Banner & Box
                    row.RelativeItem(5).Column(left =>
                    {
                        left.Item().Background(PrimaryBlue).PaddingVertical(3).PaddingHorizontal(8)
                            .Text("BILL TO").Bold().FontSize(9).FontColor("#FFFFFF");

                        left.Item().Border(1).BorderColor(BorderColor).Padding(6).Column(c =>
                        {
                            if (!string.IsNullOrWhiteSpace(_model.Attention))
                                c.Item().Text(_model.Attention).FontSize(8.5f);

                            c.Item().Text(_model.CustomerName).Bold().FontSize(9.5f).FontColor("#0F172A");

                            if (!string.IsNullOrWhiteSpace(_model.CustomerAddress))
                            {
                                foreach (var line in _model.CustomerAddress.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries))
                                {
                                    c.Item().Text(line.Trim()).FontSize(8.5f).FontColor("#334155");
                                }
                            }
                            else if (!string.IsNullOrWhiteSpace(_model.CustomerEmail))
                            {
                                c.Item().Text(_model.CustomerEmail).FontSize(8.5f).FontColor("#334155");
                            }
                        });
                    });

                    row.ConstantItem(15);

                    // Right Column: Invoice Meta Box
                    row.RelativeItem(4).Border(1).BorderColor(BorderColor).Column(meta =>
                    {
                        void RenderMetaRow(string label, string value, bool isBold = false)
                        {
                            meta.Item().BorderBottom(1).BorderColor(BorderColor).PaddingVertical(3).PaddingHorizontal(6).Row(r =>
                            {
                                r.RelativeItem(1).Text(label).FontSize(8).FontColor("#475569");
                                var valText = r.RelativeItem(1).AlignRight().Text(value).FontSize(8.5f);
                                if (isBold) valText.Bold();
                            });
                        }

                        RenderMetaRow("DATE", _model.IssueDate.ToString("dd-MMM-yyyy"), true);
                        RenderMetaRow("INVOICE No.", _model.InvoiceNumber, true);
                        RenderMetaRow("CUSTOMER ID", !string.IsNullOrWhiteSpace(_model.CustomerId) ? _model.CustomerId : "CDFF");
                        RenderMetaRow("CUSTOMER TIN", !string.IsNullOrWhiteSpace(_model.CustomerTin) ? _model.CustomerTin : "-");
                    });
                });

                // 4. Line Items Table
                col.Item().PaddingTop(14).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(4.2f);
                        columns.RelativeColumn(1.3f);
                    });

                    // Table Header
                    table.Header(header =>
                    {
                        header.Cell().Background(PrimaryBlue).PaddingVertical(4).PaddingHorizontal(8)
                            .Text("DESCRIPTION").Bold().FontSize(8.5f).FontColor("#FFFFFF");

                        header.Cell().Background(PrimaryBlue).PaddingVertical(4).PaddingHorizontal(8).AlignRight()
                            .Text($"AMOUNT {_model.CurrencyPrefix}").Bold().FontSize(8.5f).FontColor("#FFFFFF");
                    });

                    // Rows
                    int index = 0;
                    foreach (var item in _model.Items)
                    {
                        var bg = index % 2 == 1 ? ZebraBg : "#FFFFFF";

                        table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(8).Column(desc =>
                        {
                            var lines = item.Description.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                            if (lines.Length > 0)
                            {
                                desc.Item().Text(lines[0].Trim()).FontSize(8.5f);
                                for (int i = 1; i < lines.Length; i++)
                                {
                                    desc.Item().Text(lines[i].Trim()).FontSize(8).FontColor("#64748B");
                                }
                            }
                            else
                            {
                                desc.Item().Text(item.Description).FontSize(8.5f);
                            }
                        });

                        table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(8).AlignRight()
                            .Text(item.Amount.ToString("#,##0.00")).FontSize(8.5f);

                        index++;
                    }

                    // Pad with blank rows to match structured sample invoice look
                    int minRows = 8;
                    for (int i = index; i < minRows; i++)
                    {
                        var bg = i % 2 == 1 ? ZebraBg : "#FFFFFF";
                        table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(8).Text(" - ").FontSize(8).FontColor("#CBD5E1");
                        table.Cell().Background(bg).PaddingVertical(4).PaddingHorizontal(8).AlignRight().Text(" - ").FontSize(8).FontColor("#CBD5E1");
                    }
                });

                // 5. Totals Section (Right Aligned)
                col.Item().PaddingTop(6).Row(row =>
                {
                    row.RelativeItem(3); // spacer

                    row.RelativeItem(2).Column(totals =>
                    {
                        totals.Item().PaddingVertical(2).Row(r =>
                        {
                            r.RelativeItem(1).Text("Subtotal").FontSize(8.5f);
                            r.RelativeItem(1).AlignRight().Text(_model.Subtotal.ToString("#,##0.00")).FontSize(8.5f);
                        });

                        totals.Item().BorderBottom(1).BorderColor("#000000").PaddingVertical(2).Row(r =>
                        {
                            r.RelativeItem(1).Text("Tax").FontSize(8.5f);
                            r.RelativeItem(1).AlignRight().Text(_model.TaxAmount > 0 ? _model.TaxAmount.ToString("#,##0.00") : " - ").FontSize(8.5f);
                        });

                        totals.Item().PaddingTop(4).Background(LightBlue).PaddingVertical(3).PaddingHorizontal(4).Row(r =>
                        {
                            r.RelativeItem(1).Text($"TOTAL {_model.CurrencyPrefix}").Bold().FontSize(9.5f).FontColor("#0F172A");
                            r.RelativeItem(1).AlignRight().Text(_model.TotalAmount.ToString("#,##0.00")).Bold().FontSize(9.5f).FontColor("#0F172A");
                        });
                    });
                });

                // 6. Payment Information Box
                col.Item().PaddingTop(12).Row(row =>
                {
                    row.RelativeItem(3.2f).Column(pay =>
                    {
                        pay.Item().Background(PrimaryBlue).PaddingVertical(3).PaddingHorizontal(8)
                            .Text("Payment Information").Bold().FontSize(8.5f).FontColor("#FFFFFF");

                        pay.Item().Border(1).BorderColor(BorderColor).Padding(6).Column(c =>
                        {
                            c.Item().Text($"Account Name: {_model.BankAccountName}").Bold().FontSize(8.5f);
                            c.Item().Text($"Account Number: {_model.BankAccountNumber}").Bold().FontSize(8.5f);
                            c.Item().Text($"Bank: {_model.BankName}").FontSize(8);
                            c.Item().Text($"SWIFT Code: {_model.BankSwiftCode}").FontSize(8);
                        });
                    });

                    row.RelativeItem(2); // spacer
                });

                // 7. Signatory Section
                col.Item().PaddingTop(14).Column(sig =>
                {
                    if (_model.SignatureImageBytes != null && _model.SignatureImageBytes.Length > 0)
                    {
                        try
                        {
                            sig.Item().MaxHeight(38).MaxWidth(110).Image(_model.SignatureImageBytes);
                        }
                        catch
                        {
                            sig.Item().Text(!string.IsNullOrWhiteSpace(_model.SignedBy) ? _model.SignedBy : "Thusitha")
                                .Italic().FontSize(12).FontColor("#0F172A");
                        }
                    }
                    else
                    {
                        sig.Item().Text(!string.IsNullOrWhiteSpace(_model.SignedBy) ? _model.SignedBy : "Thusitha")
                            .Italic().FontSize(12).FontColor("#0F172A");
                    }

                    sig.Item().Text("Authorized Signature").Bold().FontSize(9).FontColor("#0F172A");
                    sig.Item().Text("Finance Department").FontSize(8).FontColor("#475569");
                });
            });
        });
    }
}
