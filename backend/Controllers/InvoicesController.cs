using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
    {
        return await _context.Invoices
            .Include(i => i.Items)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetInvoice(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        return invoice;
    }

    [HttpPost]
    public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
    {
        if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
        {
            invoice.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";
        }

        // Recalculate item totals and invoice total
        if (invoice.Items != null && invoice.Items.Any())
        {
            foreach (var item in invoice.Items)
            {
                item.Amount = item.Quantity * item.UnitPrice;
            }
            invoice.TotalAmount = invoice.Items.Sum(i => i.Amount);
        }

        invoice.CreatedAt = DateTime.UtcNow;

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(int id, Invoice updatedInvoice)
    {
        if (id != updatedInvoice.Id)
        {
            return BadRequest(new { message = "ID mismatch." });
        }

        var existingInvoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (existingInvoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        existingInvoice.InvoiceNumber = updatedInvoice.InvoiceNumber;
        existingInvoice.CustomerName = updatedInvoice.CustomerName;
        existingInvoice.CustomerEmail = updatedInvoice.CustomerEmail;
        existingInvoice.IssueDate = updatedInvoice.IssueDate;
        existingInvoice.DueDate = updatedInvoice.DueDate;
        existingInvoice.Status = updatedInvoice.Status;
        existingInvoice.Notes = updatedInvoice.Notes;

        // Replace items
        _context.InvoiceItems.RemoveRange(existingInvoice.Items);
        existingInvoice.Items = updatedInvoice.Items ?? new List<InvoiceItem>();

        foreach (var item in existingInvoice.Items)
        {
            item.Amount = item.Quantity * item.UnitPrice;
        }
        existingInvoice.TotalAmount = existingInvoice.Items.Sum(i => i.Amount);

        await _context.SaveChangesAsync();
        return Ok(existingInvoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(int id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
