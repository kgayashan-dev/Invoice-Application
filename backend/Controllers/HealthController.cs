using Microsoft.AspNetCore.Mvc;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        bool canConnect = false;
        string? error = null;

        try
        {
            canConnect = await _context.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }

        return Ok(new
        {
            status = canConnect ? "Healthy" : "Degraded",
            database = canConnect ? "Connected (MSSQL)" : "Disconnected",
            error,
            timestamp = DateTime.UtcNow
        });
    }
}
