using ClosedXML.Excel;

namespace backend.Services;

public class ExcelExportService
{
    public byte[] ExportInvoiceParticulars(InvoicePdfModel invoice)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Invoice Particulars");

        // Styling Palette
        var headerBgColor = XLColor.FromArgb(46, 100, 168); // #2E64A8
        var subHeaderBgColor = XLColor.FromArgb(207, 226, 243); // #CFE2F3
        var zebraBgColor = XLColor.FromArgb(248, 250, 252);

        // Title & Company Banner
        ws.Cell("A1").Value = invoice.CompanyName;
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;
        ws.Cell("A1").Style.Font.FontColor = headerBgColor;

        ws.Cell("A2").Value = $"{invoice.CompanyAddress} | Tel: {invoice.CompanyPhone} | Email: {invoice.CompanyEmail}";
        ws.Cell("A2").Style.Font.FontSize = 9;
        ws.Cell("A2").Style.Font.FontColor = XLColor.DarkGray;

        ws.Cell("A4").Value = "INVOICE PARTICULARS & REPORT";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 12;

        // Meta Box
        ws.Cell("A6").Value = "Invoice No:";
        ws.Cell("B6").Value = invoice.InvoiceNumber;
        ws.Cell("B6").Style.Font.Bold = true;

        ws.Cell("D6").Value = "Date:";
        ws.Cell("E6").Value = invoice.IssueDate.ToString("yyyy-MM-dd");

        ws.Cell("A7").Value = "Customer:";
        ws.Cell("B7").Value = invoice.CustomerName;
        ws.Cell("B7").Style.Font.Bold = true;

        ws.Cell("D7").Value = "Status:";
        ws.Cell("E7").Value = invoice.Status;

        ws.Cell("A8").Value = "Attention:";
        ws.Cell("B8").Value = invoice.Attention ?? "-";

        ws.Cell("D8").Value = "Customer TIN:";
        ws.Cell("E8").Value = invoice.CustomerTin ?? "-";

        ws.Range("A6:E8").Style.Font.FontSize = 10;

        // Items Table Header
        int startRow = 10;
        ws.Cell(startRow, 1).Value = "#";
        ws.Cell(startRow, 2).Value = "Description";
        ws.Cell(startRow, 3).Value = "Quantity";
        ws.Cell(startRow, 4).Value = $"Unit Price ({invoice.CurrencyPrefix})";
        ws.Cell(startRow, 5).Value = $"Amount ({invoice.CurrencyPrefix})";

        var tableHeaderRange = ws.Range(startRow, 1, startRow, 5);
        tableHeaderRange.Style.Fill.BackgroundColor = headerBgColor;
        tableHeaderRange.Style.Font.Bold = true;
        tableHeaderRange.Style.Font.FontColor = XLColor.White;
        tableHeaderRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

        int currentRow = startRow + 1;
        int itemIndex = 1;
        foreach (var item in invoice.Items)
        {
            ws.Cell(currentRow, 1).Value = itemIndex;
            ws.Cell(currentRow, 2).Value = item.Description;
            ws.Cell(currentRow, 3).Value = item.Quantity;
            ws.Cell(currentRow, 4).Value = item.UnitPrice;
            ws.Cell(currentRow, 5).Value = item.Amount;

            ws.Cell(currentRow, 4).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0.00";

            if (itemIndex % 2 == 0)
            {
                ws.Range(currentRow, 1, currentRow, 5).Style.Fill.BackgroundColor = zebraBgColor;
            }

            ws.Range(currentRow, 1, currentRow, 5).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            ws.Range(currentRow, 1, currentRow, 5).Style.Border.BottomBorderColor = XLColor.LightGray;

            itemIndex++;
            currentRow++;
        }

        // Totals
        ws.Cell(currentRow, 4).Value = "Subtotal:";
        ws.Cell(currentRow, 4).Style.Font.Bold = true;
        ws.Cell(currentRow, 5).Value = invoice.Subtotal;
        ws.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0.00";
        currentRow++;

        ws.Cell(currentRow, 4).Value = "Tax:";
        ws.Cell(currentRow, 4).Style.Font.Bold = true;
        ws.Cell(currentRow, 5).Value = invoice.TaxAmount;
        ws.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0.00";
        currentRow++;

        ws.Cell(currentRow, 4).Value = $"TOTAL ({invoice.CurrencyPrefix}):";
        ws.Cell(currentRow, 4).Style.Font.Bold = true;
        ws.Cell(currentRow, 4).Style.Fill.BackgroundColor = subHeaderBgColor;
        ws.Cell(currentRow, 5).Value = invoice.TotalAmount;
        ws.Cell(currentRow, 5).Style.Font.Bold = true;
        ws.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0.00";
        ws.Cell(currentRow, 5).Style.Fill.BackgroundColor = subHeaderBgColor;

        // Auto-fit columns
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] ExportInvoicesSummaryReport(List<InvoicePdfModel> invoices)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Invoices Summary");
        var wsItems = workbook.Worksheets.Add("Particulars Breakdown");

        var headerBgColor = XLColor.FromArgb(46, 100, 168); // #2E64A8
        var zebraBgColor = XLColor.FromArgb(248, 250, 252);

        // Sheet 1: Invoices Summary
        ws.Cell("A1").Value = "ENTERPRISE INVOICES REPORT";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;
        ws.Cell("A1").Style.Font.FontColor = headerBgColor;
        ws.Cell("A2").Value = $"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | Total Invoices: {invoices.Count}";
        ws.Cell("A2").Style.Font.FontSize = 9;

        int rowIdx = 4;
        string[] headers = {
            "Invoice No", "Date", "Customer Name", "Attention", "Customer ID",
            "Customer TIN", "Status", "Currency", "Subtotal", "Tax", "Total Amount", "Signed By", "Signed At"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(rowIdx, i + 1).Value = headers[i];
            ws.Cell(rowIdx, i + 1).Style.Fill.BackgroundColor = headerBgColor;
            ws.Cell(rowIdx, i + 1).Style.Font.Bold = true;
            ws.Cell(rowIdx, i + 1).Style.Font.FontColor = XLColor.White;
        }

        rowIdx++;
        int count = 1;
        foreach (var inv in invoices)
        {
            ws.Cell(rowIdx, 1).Value = inv.InvoiceNumber;
            ws.Cell(rowIdx, 2).Value = inv.IssueDate.ToString("yyyy-MM-dd");
            ws.Cell(rowIdx, 3).Value = inv.CustomerName;
            ws.Cell(rowIdx, 4).Value = inv.Attention ?? "-";
            ws.Cell(rowIdx, 5).Value = inv.CustomerId ?? "-";
            ws.Cell(rowIdx, 6).Value = inv.CustomerTin ?? "-";
            ws.Cell(rowIdx, 7).Value = inv.Status;
            ws.Cell(rowIdx, 8).Value = inv.Currency;
            ws.Cell(rowIdx, 9).Value = inv.Subtotal;
            ws.Cell(rowIdx, 10).Value = inv.TaxAmount;
            ws.Cell(rowIdx, 11).Value = inv.TotalAmount;
            ws.Cell(rowIdx, 12).Value = inv.SignedBy ?? "-";
            ws.Cell(rowIdx, 13).Value = inv.SignedAt.HasValue ? inv.SignedAt.Value.ToString("yyyy-MM-dd HH:mm") : "-";

            ws.Cell(rowIdx, 9).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(rowIdx, 10).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(rowIdx, 11).Style.NumberFormat.Format = "#,##0.00";

            if (count % 2 == 0)
                ws.Range(rowIdx, 1, rowIdx, headers.Length).Style.Fill.BackgroundColor = zebraBgColor;

            count++;
            rowIdx++;
        }

        ws.Columns().AdjustToContents();

        // Sheet 2: Line items breakdown
        wsItems.Cell("A1").Value = "PARTICULARS BREAKDOWN REPORT";
        wsItems.Cell("A1").Style.Font.Bold = true;
        wsItems.Cell("A1").Style.Font.FontSize = 13;
        wsItems.Cell("A1").Style.Font.FontColor = headerBgColor;

        string[] itemHeaders = { "Invoice No", "Customer Name", "Item Description", "Qty", "Unit Price", "Amount", "Currency" };
        int itemRowIdx = 3;
        for (int i = 0; i < itemHeaders.Length; i++)
        {
            wsItems.Cell(itemRowIdx, i + 1).Value = itemHeaders[i];
            wsItems.Cell(itemRowIdx, i + 1).Style.Fill.BackgroundColor = headerBgColor;
            wsItems.Cell(itemRowIdx, i + 1).Style.Font.Bold = true;
            wsItems.Cell(itemRowIdx, i + 1).Style.Font.FontColor = XLColor.White;
        }

        itemRowIdx++;
        int partCount = 1;
        foreach (var inv in invoices)
        {
            foreach (var item in inv.Items)
            {
                wsItems.Cell(itemRowIdx, 1).Value = inv.InvoiceNumber;
                wsItems.Cell(itemRowIdx, 2).Value = inv.CustomerName;
                wsItems.Cell(itemRowIdx, 3).Value = item.Description;
                wsItems.Cell(itemRowIdx, 4).Value = item.Quantity;
                wsItems.Cell(itemRowIdx, 5).Value = item.UnitPrice;
                wsItems.Cell(itemRowIdx, 6).Value = item.Amount;
                wsItems.Cell(itemRowIdx, 7).Value = inv.Currency;

                wsItems.Cell(itemRowIdx, 5).Style.NumberFormat.Format = "#,##0.00";
                wsItems.Cell(itemRowIdx, 6).Style.NumberFormat.Format = "#,##0.00";

                if (partCount % 2 == 0)
                    wsItems.Range(itemRowIdx, 1, itemRowIdx, itemHeaders.Length).Style.Fill.BackgroundColor = zebraBgColor;

                partCount++;
                itemRowIdx++;
            }
        }

        wsItems.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
