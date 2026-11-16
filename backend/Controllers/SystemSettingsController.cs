using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemSettingsController : ControllerBase
{
    private readonly DBAccess _dba;

    public SystemSettingsController(DBAccess dba)
    {
        _dba = dba;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var dt = await _dba.GetDataAsync("[dbo].[Get_System_Settings]");
        var settings = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            settings.Add(new
            {
                id = Convert.ToInt32(row["Id"]),
                category = row["Category"]?.ToString(),
                settingKey = row["SettingKey"]?.ToString(),
                settingValue = row["SettingValue"]?.ToString(),
                description = row["Description"]?.ToString(),
                updatedAt = row["UpdatedAt"] != DBNull.Value ? Convert.ToDateTime(row["UpdatedAt"]) : (DateTime?)null,
                updatedBy = row["UpdatedBy"]?.ToString()
            });
        }

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
        if (updates == null || updates.Count == 0)
        {
            return BadRequest(new { message = "No settings provided for update." });
        }

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        foreach (var item in updates)
        {
            var spParams = new[]
            {
                new SqlParameter("@Id", SqlDbType.Int) { Value = item.Id },
                new SqlParameter("@SettingValue", SqlDbType.NVarChar, 500) { Value = item.SettingValue ?? "" },
                new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
                new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
            };

            await _dba.ExecuteCommandAsync("[dbo].[Update_System_Setting]", spParams);
        }

        return Ok(new { success = true, message = "Settings updated successfully." });
    }
}
