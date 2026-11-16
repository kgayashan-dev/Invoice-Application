using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemSettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SystemSettingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _context.SystemSettings.OrderBy(s => s.Category).ThenBy(s => s.SettingKey).ToListAsync();
        return Ok(settings);
    }

    public class UpdateSettingDto
    {
        public int Id { get; set; }
        public string SettingValue { get; set; } = string.Empty;
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] List<UpdateSettingDto> updates)
    {
        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";

        foreach (var item in updates)
        {
            var setting = await _context.SystemSettings.FindAsync(item.Id);
            if (setting != null)
            {
                var oldVal = setting.SettingValue;
                setting.SettingValue = item.SettingValue;
                setting.UpdatedAt = DateTime.UtcNow;
                setting.UpdatedBy = operatorUser;

                _context.AuditTrails.Add(new AuditTrail
                {
                    UserName = operatorUser,
                    Action = "UPDATE_SETTING",
                    Module = "SETTINGS",
                    Details = $"{setting.Category}.{setting.SettingKey}: '{oldVal}' -> '{item.SettingValue}'",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Settings updated successfully." });
    }
}
