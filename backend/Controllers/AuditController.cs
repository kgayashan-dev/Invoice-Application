using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly DBAccess _dba;

    public AuditController(DBAccess dba)
    {
        _dba = dba;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs([FromQuery] string? module, [FromQuery] string? search, [FromQuery] int limit = 100)
    {
        var spParams = new[]
        {
            new SqlParameter("@Module", SqlDbType.NVarChar, 100) { Value = string.IsNullOrWhiteSpace(module) ? (object)DBNull.Value : module.Trim() },
            new SqlParameter("@Search", SqlDbType.NVarChar, 200) { Value = string.IsNullOrWhiteSpace(search) ? (object)DBNull.Value : search.Trim() },
            new SqlParameter("@Limit", SqlDbType.Int) { Value = limit <= 0 ? 100 : limit }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Get_Audit_Logs]", spParams);
        var logs = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            logs.Add(new
            {
                id = Convert.ToInt32(row["Id"]),
                timestamp = Convert.ToDateTime(row["Timestamp"]),
                userName = row["UserName"]?.ToString(),
                action = row["Action"]?.ToString(),
                module = row["Module"]?.ToString(),
                details = row["Details"]?.ToString(),
                ipAddress = row["IpAddress"]?.ToString()
            });
        }

        return Ok(logs);
    }
}
