using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuditController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs([FromQuery] string? module, [FromQuery] string? search, [FromQuery] int limit = 100)
    {
        var query = _context.AuditTrails.AsQueryable();

        if (!string.IsNullOrWhiteSpace(module) && module != "ALL")
        {
            query = query.Where(a => a.Module == module);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a => a.UserName.ToLower().Contains(s) || a.Action.ToLower().Contains(s) || (a.Details != null && a.Details.ToLower().Contains(s)));
        }

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .ToListAsync();

        return Ok(logs);
    }
}
