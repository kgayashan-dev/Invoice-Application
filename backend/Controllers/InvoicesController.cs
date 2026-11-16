using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly DBAccess _dba;

    public InvoicesController(DBAccess dba)
    {
        _dba = dba;
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
                customerEmail = row["CustomerEmail"]?.ToString(),
                issueDate = Convert.ToDateTime(row["IssueDate"]),
                dueDate = Convert.ToDateTime(row["DueDate"]),
                status = row["Status"]?.ToString(),
                totalAmount = Convert.ToDecimal(row["TotalAmount"]),
                notes = row["Notes"]?.ToString(),
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
            customerEmail = row["CustomerEmail"]?.ToString(),
            issueDate = Convert.ToDateTime(row["IssueDate"]),
            dueDate = Convert.ToDateTime(row["DueDate"]),
            status = row["Status"]?.ToString(),
            totalAmount = Convert.ToDecimal(row["TotalAmount"]),
            notes = row["Notes"]?.ToString(),
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
            invoice.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";
        }

        if (invoice.Items != null && invoice.Items.Any())
        {
            foreach (var item in invoice.Items)
            {
                item.Amount = item.Quantity * item.UnitPrice;
            }
            invoice.TotalAmount = invoice.Items.Sum(i => i.Amount);
        }

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@InvoiceNumber", SqlDbType.NVarChar, 50) { Value = invoice.InvoiceNumber },
            new SqlParameter("@CustomerName", SqlDbType.NVarChar, 200) { Value = invoice.CustomerName },
            new SqlParameter("@CustomerEmail", SqlDbType.NVarChar, 200) { Value = (object?)invoice.CustomerEmail ?? DBNull.Value },
            new SqlParameter("@IssueDate", SqlDbType.DateTime2) { Value = invoice.IssueDate == default ? DateTime.UtcNow : invoice.IssueDate },
            new SqlParameter("@DueDate", SqlDbType.DateTime2) { Value = invoice.DueDate == default ? DateTime.UtcNow.AddDays(14) : invoice.DueDate },
            new SqlParameter("@Status", SqlDbType.NVarChar, 50) { Value = string.IsNullOrWhiteSpace(invoice.Status) ? "Pending" : invoice.Status },
            new SqlParameter("@TotalAmount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = invoice.TotalAmount },
            new SqlParameter("@Notes", SqlDbType.NVarChar, -1) { Value = (object?)invoice.Notes ?? DBNull.Value },
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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(int id, [FromBody] Invoice updatedInvoice)
    {
        if (id != updatedInvoice.Id && updatedInvoice.Id != 0)
        {
            return BadRequest(new { message = "ID mismatch." });
        }

        if (updatedInvoice.Items != null && updatedInvoice.Items.Any())
        {
            foreach (var item in updatedInvoice.Items)
            {
                item.Amount = item.Quantity * item.UnitPrice;
            }
            updatedInvoice.TotalAmount = updatedInvoice.Items.Sum(i => i.Amount);
        }

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@Id", SqlDbType.Int) { Value = id },
            new SqlParameter("@InvoiceNumber", SqlDbType.NVarChar, 50) { Value = updatedInvoice.InvoiceNumber },
            new SqlParameter("@CustomerName", SqlDbType.NVarChar, 200) { Value = updatedInvoice.CustomerName },
            new SqlParameter("@CustomerEmail", SqlDbType.NVarChar, 200) { Value = (object?)updatedInvoice.CustomerEmail ?? DBNull.Value },
            new SqlParameter("@IssueDate", SqlDbType.DateTime2) { Value = updatedInvoice.IssueDate },
            new SqlParameter("@DueDate", SqlDbType.DateTime2) { Value = updatedInvoice.DueDate },
            new SqlParameter("@Status", SqlDbType.NVarChar, 50) { Value = updatedInvoice.Status },
            new SqlParameter("@TotalAmount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = updatedInvoice.TotalAmount },
            new SqlParameter("@Notes", SqlDbType.NVarChar, -1) { Value = (object?)updatedInvoice.Notes ?? DBNull.Value },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        await _dba.ExecuteCommandAsync("[dbo].[Update_Invoice]", spParams);

        if (updatedInvoice.Items != null && updatedInvoice.Items.Any())
        {
            foreach (var item in updatedInvoice.Items)
            {
                var itemParams = new[]
                {
                    new SqlParameter("@InvoiceId", SqlDbType.Int) { Value = id },
                    new SqlParameter("@Description", SqlDbType.NVarChar, 250) { Value = item.Description },
                    new SqlParameter("@Quantity", SqlDbType.Int) { Value = item.Quantity },
                    new SqlParameter("@UnitPrice", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = item.UnitPrice },
                    new SqlParameter("@Amount", SqlDbType.Decimal) { Precision = 18, Scale = 2, Value = item.Amount }
                };
                await _dba.ExecuteCommandAsync("[dbo].[Insert_Invoice_Item]", itemParams);
            }
        }

        updatedInvoice.Id = id;
        return Ok(updatedInvoice);
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

        await _dba.ExecuteCommandAsync("[dbo].[Delete_Invoice]", spParams);
        return NoContent();
    }
}
