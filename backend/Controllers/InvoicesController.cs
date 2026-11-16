using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;
using backend.Models;
using backend.Services;
using QuestPDF.Fluent;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly DBAccess _dba;
    private readonly ExcelExportService _excelExport;

    public InvoicesController(DBAccess dba, ExcelExportService excelExport)
    {
        _dba = dba;
        _excelExport = excelExport;
    }

    [HttpGet]
    public IActionResult GetInvoices()
    {
        var ds = _dba.GetDataSet("[dbo].[Get_All_Invoices]");
        if (ds.Tables.Count < 2)
            return Ok(new List<object>());

        var invoicesDt = ds.Tables[0];
        var itemsDt = ds.Tables[1];

        var itemsLookup = new Dictionary<int, List<object>>();
        foreach (DataRow itemRow in itemsDt.Rows)
        {
            var invId = Convert.ToInt32(itemRow["InvoiceId"]);
            if (!itemsLookup.ContainsKey(invId))
                itemsLookup[invId] = new List<object>();

            itemsLookup[invId].Add(new
            {
                id = Convert.ToInt32(itemRow["Id"]),
                invoiceId = invId,
                description = itemRow["Description"]?.ToString(),
                quantity = Convert.ToInt32(itemRow["Quantity"]),
                unitPrice = Convert.ToDecimal(itemRow["UnitPrice"]),
                amount = Convert.ToDecimal(itemRow["Amount"])
            });
        }

        var list = new List<object>();
        foreach (DataRow row in invoicesDt.Rows)
        {
            var invId = Convert.ToInt32(row["Id"]);
            list.Add(new
            {
                id = invId,
                invoiceNumber = row["InvoiceNumber"]?.ToString(),
                customerName = row["CustomerName"]?.ToString(),
                customerEmail = row["CustomerEmail"] != DBNull.Value ? row["CustomerEmail"]?.ToString() : null,
                customerAddress = row["CustomerAddress"] != DBNull.Value ? row["CustomerAddress"]?.ToString() : null,
                attention = row["Attention"] != DBNull.Value ? row["Attention"]?.ToString() : null,
                customerId = row["CustomerId"] != DBNull.Value ? row["CustomerId"]?.ToString() : null,
                customerTin = row["CustomerTin"] != DBNull.Value ? row["CustomerTin"]?.ToString() : null,
                issueDate = Convert.ToDateTime(row["IssueDate"]),
                dueDate = Convert.ToDateTime(row["DueDate"]),
                status = row["Status"]?.ToString(),
                subtotal = row["Subtotal"] != DBNull.Value ? Convert.ToDecimal(row["Subtotal"]) : Convert.ToDecimal(row["TotalAmount"]),
                taxAmount = row["TaxAmount"] != DBNull.Value ? Convert.ToDecimal(row["TaxAmount"]) : 0m,
                totalAmount = Convert.ToDecimal(row["TotalAmount"]),
                notes = row["Notes"] != DBNull.Value ? row["Notes"]?.ToString() : null,
                signedBy = row["SignedBy"] != DBNull.Value ? row["SignedBy"]?.ToString() : null,
                signedAt = row["SignedAt"] != DBNull.Value ? Convert.ToDateTime(row["SignedAt"]) : (DateTime?)null,
                signatureData = row["SignatureData"] != DBNull.Value ? row["SignatureData"]?.ToString() : null,
                financeReviewNotes = row["FinanceReviewNotes"] != DBNull.Value ? row["FinanceReviewNotes"]?.ToString() : null,
                currency = row["Currency"] != DBNull.Value ? row["Currency"]?.ToString() : "LKR",
                logoId = row["LogoId"] != DBNull.Value ? (int?)Convert.ToInt32(row["LogoId"]) : null,
                signatureId = row["SignatureId"] != DBNull.Value ? (int?)Convert.ToInt32(row["SignatureId"]) : null,
                bankName = row["BankName"] != DBNull.Value ? row["BankName"]?.ToString() : null,
                bankAccountName = row["BankAccountName"] != DBNull.Value ? row["BankAccountName"]?.ToString() : null,
                bankAccountNumber = row["BankAccountNumber"] != DBNull.Value ? row["BankAccountNumber"]?.ToString() : null,
                bankSwiftCode = row["BankSwiftCode"] != DBNull.Value ? row["BankSwiftCode"]?.ToString() : null,
                createdAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : (DateTime?)null,
                items = itemsLookup.ContainsKey(invId) ? itemsLookup[invId] : new List<object>()
            });
        }

        return Ok(list);
    }

    [HttpGet("{id}")]
    public IActionResult GetInvoice(int id)
    {
        var spParams = new[]
        {
            new SqlParameter("@Id", SqlDbType.Int) { Value = id }
        };

        var ds = _dba.GetDataSet("[dbo].[Get_Invoice_By_Id]", spParams);
        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        var row = ds.Tables[0].Rows[0];
        var items = new List<object>();

        if (ds.Tables.Count > 1)
        {
            foreach (DataRow itemRow in ds.Tables[1].Rows)
            {
                items.Add(new
                {
                    id = Convert.ToInt32(itemRow["Id"]),
                    invoiceId = id,
                    description = itemRow["Description"]?.ToString(),
                    quantity = Convert.ToInt32(itemRow["Quantity"]),
                    unitPrice = Convert.ToDecimal(itemRow["UnitPrice"]),
                    amount = Convert.ToDecimal(itemRow["Amount"])
                });
            }
        }

        var invoice = new
        {
            id = Convert.ToInt32(row["Id"]),
            invoiceNumber = row["InvoiceNumber"]?.ToString(),
            customerName = row["CustomerName"]?.ToString(),
            customerEmail = row["CustomerEmail"] != DBNull.Value ? row["CustomerEmail"]?.ToString() : null,
            customerAddress = row["CustomerAddress"] != DBNull.Value ? row["CustomerAddress"]?.ToString() : null,
            attention = row["Attention"] != DBNull.Value ? row["Attention"]?.ToString() : null,
            customerId = row["CustomerId"] != DBNull.Value ? row["CustomerId"]?.ToString() : null,
            customerTin = row["CustomerTin"] != DBNull.Value ? row["CustomerTin"]?.ToString() : null,
            issueDate = Convert.ToDateTime(row["IssueDate"]),
            dueDate = Convert.ToDateTime(row["DueDate"]),
            status = row["Status"]?.ToString(),
            subtotal = row["Subtotal"] != DBNull.Value ? Convert.ToDecimal(row["Subtotal"]) : Convert.ToDecimal(row["TotalAmount"]),
            taxAmount = row["TaxAmount"] != DBNull.Value ? Convert.ToDecimal(row["TaxAmount"]) : 0m,
            totalAmount = Convert.ToDecimal(row["TotalAmount"]),
            notes = row["Notes"] != DBNull.Value ? row["Notes"]?.ToString() : null,
            signedBy = row["SignedBy"] != DBNull.Value ? row["SignedBy"]?.ToString() : null,
            signedAt = row["SignedAt"] != DBNull.Value ? Convert.ToDateTime(row["SignedAt"]) : (DateTime?)null,
            signatureData = row["SignatureData"] != DBNull.Value ? row["SignatureData"]?.ToString() : null,
            financeReviewNotes = row["FinanceReviewNotes"] != DBNull.Value ? row["FinanceReviewNotes"]?.ToString() : null,
            currency = row["Currency"] != DBNull.Value ? row["Currency"]?.ToString() : "LKR",
            logoId = row["LogoId"] != DBNull.Value ? (int?)Convert.ToInt32(row["LogoId"]) : null,
            signatureId = row["SignatureId"] != DBNull.Value ? (int?)Convert.ToInt32(row["SignatureId"]) : null,
            bankName = row["BankName"] != DBNull.Value ? row["BankName"]?.ToString() : null,
            bankAccountName = row["BankAccountName"] != DBNull.Value ? row["BankAccountName"]?.ToString() : null,
            bankAccountNumber = row["BankAccountNumber"] != DBNull.Value ? row["BankAccountNumber"]?.ToString() : null,
            bankSwiftCode = row["BankSwiftCode"] != DBNull.Value ? row["BankSwiftCode"]?.ToString() : null,
            createdAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : (DateTime?)null,
            items
        };

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] Invoice invoice)
    {
        if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
        {
            invoice.InvoiceNumber = $"AP-I{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";
        }

        if (invoice.Items != null && invoice.Items.Any())
        {
            foreach (var item in invoice.Items)
            {
                item.Amount = item.Quantity * item.UnitPrice;
            }
            invoice.Subtotal = invoice.Items.Sum(i => i.Amount);
            invoice.TotalAmount = invoice.Subtotal + invoice.TaxAmount;
        }
        else
        {
            invoice.TotalAmount = invoice.Subtotal + invoice.TaxAmount;
        }

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@InvoiceNumber", SqlDbType.NVarChar, 50) { Value = invoice.InvoiceNumber },
            new SqlParameter("@CustomerName", SqlDbType.NVarChar, 200) { Value = invoice.CustomerName },
            new SqlParameter("@CustomerEmail", SqlDbType.NVarChar, 200) { Value = (object?)invoice.CustomerEmail ?? DBNull.Value },
            new SqlParameter("@CustomerAddress", SqlDbType.NVarChar, 500) { Value = (object?)invoice.CustomerAddress ?? DBNull.Value },
            new SqlParameter("@Attention", SqlDbType.NVarChar, 200) { Value = (object?)invoice.Attention ?? DBNull.Value },
            new SqlParameter("@CustomerId", SqlDbType.NVarChar, 50) { Value = (object?)invoice.CustomerId ?? DBNull.Value },
            new SqlParameter("@CustomerTin", SqlDbType.NVarChar, 50) { Value = (object?)invoice.CustomerTin ?? DBNull.Value },
            new SqlParameter("@IssueDate", SqlDbType.DateTime2) { Value = invoice.IssueDate == default ? DateTime.UtcNow : invoice.IssueDate },
            new SqlParameter("@DueDate", SqlDbType.DateTime2) { Value = invoice.DueDate == default ? DateTime.UtcNow.AddDays(14) : invoice.DueDate },
            new SqlParameter("@Status", SqlDbType.NVarChar, 50) { Value = string.IsNullOrWhiteSpace(invoice.Status) ? "Draft" : invoice.Status },
            new SqlParameter("@Subtotal", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = invoice.Subtotal },
            new SqlParameter("@TaxAmount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = invoice.TaxAmount },
            new SqlParameter("@TotalAmount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = invoice.TotalAmount },
            new SqlParameter("@Currency", SqlDbType.VarChar, 10) { Value = string.IsNullOrWhiteSpace(invoice.Currency) ? "LKR" : invoice.Currency },
            new SqlParameter("@Notes", SqlDbType.NVarChar, -1) { Value = (object?)invoice.Notes ?? DBNull.Value },
            new SqlParameter("@LogoId", SqlDbType.Int) { Value = (object?)invoice.LogoId ?? DBNull.Value },
            new SqlParameter("@SignatureId", SqlDbType.Int) { Value = (object?)invoice.SignatureId ?? DBNull.Value },
            new SqlParameter("@BankName", SqlDbType.NVarChar, 200) { Value = (object?)invoice.BankName ?? DBNull.Value },
            new SqlParameter("@BankAccountName", SqlDbType.NVarChar, 200) { Value = (object?)invoice.BankAccountName ?? DBNull.Value },
            new SqlParameter("@BankAccountNumber", SqlDbType.NVarChar, 100) { Value = (object?)invoice.BankAccountNumber ?? DBNull.Value },
            new SqlParameter("@BankSwiftCode", SqlDbType.NVarChar, 50) { Value = (object?)invoice.BankSwiftCode ?? DBNull.Value },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Insert_Invoice]", spParams);
        var newInvoiceId = Convert.ToInt32(dt.Rows[0]["InvoiceId"]);
        invoice.Id = newInvoiceId;

        if (invoice.Items != null && invoice.Items.Any())
        {
            foreach (var item in invoice.Items)
            {
                var itemParams = new[]
                {
                    new SqlParameter("@InvoiceId", SqlDbType.Int) { Value = newInvoiceId },
                    new SqlParameter("@Description", SqlDbType.NVarChar, 250) { Value = item.Description },
                    new SqlParameter("@Quantity", SqlDbType.Int) { Value = item.Quantity },
                    new SqlParameter("@UnitPrice", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = item.UnitPrice },
                    new SqlParameter("@Amount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = item.Amount }
                };
                await _dba.ExecuteCommandAsync("[dbo].[Insert_Invoice_Item]", itemParams);
            }
        }

        return CreatedAtAction(nameof(GetInvoice), new { id = newInvoiceId }, invoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(int id)
    {
        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@Id", SqlDbType.Int) { Value = id },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Delete_Invoice]", spParams);
        if (dt != null && dt.Rows.Count > 0 && Convert.ToInt32(dt.Rows[0]["Success"]) == 1)
        {
            return Ok(new { success = true, message = dt.Rows[0]["Message"]?.ToString() });
        }

        return NotFound(new { success = false, message = "Invoice not found or already deleted." });
    }

    public class RequestSignatureDto
    {
        public string? Notes { get; set; }
    }

    [HttpPost("{id}/request-signature")]
    public async Task<IActionResult> RequestSignature(int id, [FromBody] RequestSignatureDto? dto)
    {
        var operatorUser = HttpContext.Session.GetString("FullName")
                        ?? HttpContext.Session.GetString("UserName")
                        ?? Request.Headers["X-UserName"].FirstOrDefault()
                        ?? "Finance Manager";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@InvoiceId", SqlDbType.Int) { Value = id },
            new SqlParameter("@RequestedBy", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@Notes", SqlDbType.NVarChar, -1) { Value = (object?)dto?.Notes ?? DBNull.Value },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Request_Invoice_Signature]", spParams);
        if (dt != null && dt.Rows.Count > 0 && Convert.ToInt32(dt.Rows[0]["Success"]) == 1)
        {
            return Ok(new
            {
                success = true,
                message = dt.Rows[0]["Message"]?.ToString(),
                invoiceNumber = dt.Rows[0]["InvoiceNumber"]?.ToString()
            });
        }

        return BadRequest(new { success = false, message = "Could not request signature." });
    }

    public class SignInvoiceDto
    {
        public string? SignatureData { get; set; }
        public int? SignatureId { get; set; }
    }

    [HttpPost("{id}/sign")]
    public async Task<IActionResult> SignInvoice(int id, [FromBody] SignInvoiceDto? dto)
    {
        var operatorUser = HttpContext.Session.GetString("FullName")
                        ?? HttpContext.Session.GetString("UserName")
                        ?? Request.Headers["X-UserName"].FirstOrDefault()
                        ?? "Billing Officer";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@InvoiceId", SqlDbType.Int) { Value = id },
            new SqlParameter("@SignedBy", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@SignatureData", SqlDbType.NVarChar, -1) { Value = (object?)dto?.SignatureData ?? DBNull.Value },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Sign_Invoice]", spParams);
        if (dt != null && dt.Rows.Count > 0 && Convert.ToInt32(dt.Rows[0]["Success"]) == 1)
        {
            return Ok(new
            {
                success = true,
                message = dt.Rows[0]["Message"]?.ToString(),
                signedBy = operatorUser,
                signedAt = DateTime.UtcNow
            });
        }

        return BadRequest(new { success = false, message = "Could not sign invoice." });
    }

    // ────────────────────────────────────────────────────────────────────────────
    // QUESTPDF & CLOSEDXML REPORT GENERATION
    // ────────────────────────────────────────────────────────────────────────────

    public class GeneratePdfRequestDto
    {
        public int? LogoId { get; set; }
        public int? SignatureId { get; set; }
    }

    [HttpPost("{id}/generate-pdf")]
    public async Task<IActionResult> GeneratePdf(int id, [FromBody] GeneratePdfRequestDto? request)
    {
        var model = await BuildInvoicePdfModelAsync(id, request?.LogoId, request?.SignatureId);
        if (model == null)
            return NotFound(new { message = $"Invoice with ID {id} not found." });

        var doc = new QuestPdfInvoiceDocument(model);
        var pdfBytes = doc.GeneratePdf();

        var safeInvNum = string.IsNullOrWhiteSpace(model.InvoiceNumber) ? $"Invoice_{id}" : model.InvoiceNumber.Replace("/", "_");
        return File(pdfBytes, "application/pdf", $"{safeInvNum}.pdf");
    }

    [HttpGet("{id}/export-excel")]
    public async Task<IActionResult> ExportInvoiceExcel(int id)
    {
        var model = await BuildInvoicePdfModelAsync(id);
        if (model == null)
            return NotFound(new { message = $"Invoice with ID {id} not found." });

        var excelBytes = _excelExport.ExportInvoiceParticulars(model);
        var safeInvNum = string.IsNullOrWhiteSpace(model.InvoiceNumber) ? $"Invoice_{id}" : model.InvoiceNumber.Replace("/", "_");
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{safeInvNum}_Particulars.xlsx");
    }

    [HttpGet("export-report-excel")]
    public async Task<IActionResult> ExportAllInvoicesExcel()
    {
        var ds = await _dba.GetDataSetAsync("[dbo].[Get_All_Invoices]");
        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
            return BadRequest(new { message = "No invoices available to export." });

        var invoicesDt = ds.Tables[0];
        var itemsDt = ds.Tables.Count > 1 ? ds.Tables[1] : null;

        var itemsLookup = new Dictionary<int, List<InvoicePdfItemModel>>();
        if (itemsDt != null)
        {
            foreach (DataRow itemRow in itemsDt.Rows)
            {
                var invId = Convert.ToInt32(itemRow["InvoiceId"]);
                if (!itemsLookup.ContainsKey(invId))
                    itemsLookup[invId] = new List<InvoicePdfItemModel>();

                itemsLookup[invId].Add(new InvoicePdfItemModel
                {
                    Description = itemRow["Description"]?.ToString() ?? "",
                    Quantity = Convert.ToInt32(itemRow["Quantity"]),
                    UnitPrice = Convert.ToDecimal(itemRow["UnitPrice"]),
                    Amount = Convert.ToDecimal(itemRow["Amount"])
                });
            }
        }

        var list = new List<InvoicePdfModel>();
        foreach (DataRow row in invoicesDt.Rows)
        {
            var invId = Convert.ToInt32(row["Id"]);
            var cur = row["Currency"] != DBNull.Value ? row["Currency"]?.ToString() ?? "LKR" : "LKR";

            list.Add(new InvoicePdfModel
            {
                InvoiceNumber = row["InvoiceNumber"]?.ToString() ?? "",
                CustomerName = row["CustomerName"]?.ToString() ?? "",
                CustomerEmail = row["CustomerEmail"] != DBNull.Value ? row["CustomerEmail"]?.ToString() : null,
                CustomerAddress = row["CustomerAddress"] != DBNull.Value ? row["CustomerAddress"]?.ToString() : null,
                Attention = row["Attention"] != DBNull.Value ? row["Attention"]?.ToString() : null,
                CustomerId = row["CustomerId"] != DBNull.Value ? row["CustomerId"]?.ToString() : null,
                CustomerTin = row["CustomerTin"] != DBNull.Value ? row["CustomerTin"]?.ToString() : null,
                IssueDate = Convert.ToDateTime(row["IssueDate"]),
                DueDate = Convert.ToDateTime(row["DueDate"]),
                Status = row["Status"]?.ToString() ?? "Draft",
                Subtotal = row["Subtotal"] != DBNull.Value ? Convert.ToDecimal(row["Subtotal"]) : Convert.ToDecimal(row["TotalAmount"]),
                TaxAmount = row["TaxAmount"] != DBNull.Value ? Convert.ToDecimal(row["TaxAmount"]) : 0m,
                TotalAmount = Convert.ToDecimal(row["TotalAmount"]),
                Currency = cur,
                CurrencyPrefix = ResolveCurrencyPrefix(cur),
                SignedBy = row["SignedBy"] != DBNull.Value ? row["SignedBy"]?.ToString() : null,
                SignedAt = row["SignedAt"] != DBNull.Value ? Convert.ToDateTime(row["SignedAt"]) : (DateTime?)null,
                Items = itemsLookup.ContainsKey(invId) ? itemsLookup[invId] : new List<InvoicePdfItemModel>()
            });
        }

        var excelBytes = _excelExport.ExportInvoicesSummaryReport(list);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Invoices_Particulars_Report_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    private async Task<InvoicePdfModel?> BuildInvoicePdfModelAsync(int invoiceId, int? selectedLogoId = null, int? selectedSignatureId = null)
    {
        var spParams = new[] { new SqlParameter("@Id", SqlDbType.Int) { Value = invoiceId } };
        var ds = _dba.GetDataSet("[dbo].[Get_Invoice_By_Id]", spParams);
        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0) return null;

        var row = ds.Tables[0].Rows[0];
        var cur = row["Currency"] != DBNull.Value ? row["Currency"]?.ToString() ?? "LKR" : "LKR";

        var model = new InvoicePdfModel
        {
            InvoiceNumber = row["InvoiceNumber"]?.ToString() ?? "",
            CustomerName = row["CustomerName"]?.ToString() ?? "",
            CustomerEmail = row["CustomerEmail"] != DBNull.Value ? row["CustomerEmail"]?.ToString() : null,
            CustomerAddress = row["CustomerAddress"] != DBNull.Value ? row["CustomerAddress"]?.ToString() : null,
            Attention = row["Attention"] != DBNull.Value ? row["Attention"]?.ToString() : null,
            CustomerId = row["CustomerId"] != DBNull.Value ? row["CustomerId"]?.ToString() : null,
            CustomerTin = row["CustomerTin"] != DBNull.Value ? row["CustomerTin"]?.ToString() : null,
            IssueDate = Convert.ToDateTime(row["IssueDate"]),
            DueDate = Convert.ToDateTime(row["DueDate"]),
            Status = row["Status"]?.ToString() ?? "Draft",
            Subtotal = row["Subtotal"] != DBNull.Value ? Convert.ToDecimal(row["Subtotal"]) : Convert.ToDecimal(row["TotalAmount"]),
            TaxAmount = row["TaxAmount"] != DBNull.Value ? Convert.ToDecimal(row["TaxAmount"]) : 0m,
            TotalAmount = Convert.ToDecimal(row["TotalAmount"]),
            Currency = cur,
            CurrencyPrefix = ResolveCurrencyPrefix(cur),
            Notes = row["Notes"] != DBNull.Value ? row["Notes"]?.ToString() : null,
            SignedBy = row["SignedBy"] != DBNull.Value ? row["SignedBy"]?.ToString() : null,
            SignedAt = row["SignedAt"] != DBNull.Value ? Convert.ToDateTime(row["SignedAt"]) : (DateTime?)null
        };

        // Items
        if (ds.Tables.Count > 1)
        {
            foreach (DataRow itemRow in ds.Tables[1].Rows)
            {
                model.Items.Add(new InvoicePdfItemModel
                {
                    Description = itemRow["Description"]?.ToString() ?? "",
                    Quantity = Convert.ToInt32(itemRow["Quantity"]),
                    UnitPrice = Convert.ToDecimal(itemRow["UnitPrice"]),
                    Amount = Convert.ToDecimal(itemRow["Amount"])
                });
            }
        }

        // Fetch System Settings
        var settingsDt = await _dba.GetDataAsync("[dbo].[Get_System_Settings]");
        var settings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (DataRow sRow in settingsDt.Rows)
        {
            var key = sRow["SettingKey"]?.ToString();
            var val = sRow["SettingValue"]?.ToString();
            if (!string.IsNullOrEmpty(key)) settings[key] = val ?? "";
        }

        if (settings.TryGetValue("CompanyName", out var cName) && !string.IsNullOrWhiteSpace(cName)) model.CompanyName = cName;
        if (settings.TryGetValue("CompanyAddress", out var cAddr) && !string.IsNullOrWhiteSpace(cAddr)) model.CompanyAddress = cAddr;
        if (settings.TryGetValue("CompanyPhone", out var cPhone) && !string.IsNullOrWhiteSpace(cPhone)) model.CompanyPhone = cPhone;
        if (settings.TryGetValue("CompanyEmail", out var cEmail) && !string.IsNullOrWhiteSpace(cEmail)) model.CompanyEmail = cEmail;
        if (settings.TryGetValue("CompanyTIN", out var cTin) && !string.IsNullOrWhiteSpace(cTin)) model.CompanyTin = cTin;

        // Banking details
        if (row["BankAccountName"] != DBNull.Value && !string.IsNullOrWhiteSpace(row["BankAccountName"]?.ToString()))
            model.BankAccountName = row["BankAccountName"]!.ToString()!;
        else if (settings.TryGetValue("BankAccountName", out var bAcct) && !string.IsNullOrWhiteSpace(bAcct))
            model.BankAccountName = bAcct;

        if (row["BankAccountNumber"] != DBNull.Value && !string.IsNullOrWhiteSpace(row["BankAccountNumber"]?.ToString()))
            model.BankAccountNumber = row["BankAccountNumber"]!.ToString()!;
        else if (settings.TryGetValue("BankAccountNumber", out var bNum) && !string.IsNullOrWhiteSpace(bNum))
            model.BankAccountNumber = bNum;

        if (row["BankName"] != DBNull.Value && !string.IsNullOrWhiteSpace(row["BankName"]?.ToString()))
            model.BankName = row["BankName"]!.ToString()!;
        else if (settings.TryGetValue("BankName", out var bName) && !string.IsNullOrWhiteSpace(bName))
            model.BankName = bName;

        if (row["BankSwiftCode"] != DBNull.Value && !string.IsNullOrWhiteSpace(row["BankSwiftCode"]?.ToString()))
            model.BankSwiftCode = row["BankSwiftCode"]!.ToString()!;
        else if (settings.TryGetValue("BankSwiftCode", out var bSwift) && !string.IsNullOrWhiteSpace(bSwift))
            model.BankSwiftCode = bSwift;

        // Resolve Logo
        int? targetLogoId = selectedLogoId ?? (row["LogoId"] != DBNull.Value ? (int?)Convert.ToInt32(row["LogoId"]) : null);
        model.LogoImageBytes = await FetchAssetImageBytesAsync(targetLogoId, "Logo");

        // Resolve Signature
        int? targetSigId = selectedSignatureId ?? (row["SignatureId"] != DBNull.Value ? (int?)Convert.ToInt32(row["SignatureId"]) : null);
        model.SignatureImageBytes = await FetchAssetImageBytesAsync(targetSigId, "Signature");

        return model;
    }

    private async Task<byte[]?> FetchAssetImageBytesAsync(int? assetId, string assetType)
    {
        var spParams = new[]
        {
            new SqlParameter("@AssetType", SqlDbType.NVarChar, 50) { Value = assetType }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Get_App_Assets]", spParams);
        if (dt == null || dt.Rows.Count == 0) return null;

        DataRow? matched = null;
        if (assetId.HasValue)
        {
            foreach (DataRow r in dt.Rows)
            {
                if (Convert.ToInt32(r["Id"]) == assetId.Value)
                {
                    matched = r;
                    break;
                }
            }
        }

        // Fallback to default
        if (matched == null)
        {
            foreach (DataRow r in dt.Rows)
            {
                if (Convert.ToBoolean(r["IsDefault"]))
                {
                    matched = r;
                    break;
                }
            }
        }

        // Fallback to first available
        matched ??= dt.Rows[0];

        var rawData = matched["ImageData"]?.ToString();
        return ParseBase64Image(rawData);
    }

    private static byte[]? ParseBase64Image(string? dataUrl)
    {
        if (string.IsNullOrWhiteSpace(dataUrl)) return null;
        try
        {
            var commaIdx = dataUrl.IndexOf(',');
            var cleanBase64 = commaIdx >= 0 ? dataUrl.Substring(commaIdx + 1) : dataUrl;
            return Convert.FromBase64String(cleanBase64.Trim());
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveCurrencyPrefix(string currency)
    {
        return currency.ToUpper() switch
        {
            "LKR" => "Rs.",
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            "INR" => "₹",
            "AUD" => "A$",
            "CAD" => "C$",
            _ => currency
        };
    }
}
