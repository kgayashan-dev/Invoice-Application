using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly DBAccess _dba;

    public NotificationsController(DBAccess dba)
    {
        _dba = dba;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userName = HttpContext.Session.GetString("UserName")
                    ?? HttpContext.Session.GetString("LoginID")
                    ?? Request.Headers["X-UserName"].FirstOrDefault()
                    ?? "Guest";

        var roleName = HttpContext.Session.GetString("UserRole")
                    ?? Request.Headers["X-User-Role"].FirstOrDefault()
                    ?? "";

        var spParams = new[]
        {
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName },
            new SqlParameter("@RoleName", SqlDbType.NVarChar, 100) { Value = (object?)roleName ?? DBNull.Value }
        };

        var ds = await _dba.GetDataSetAsync("[dbo].[Get_User_Notifications]", spParams);
        var items = new List<object>();
        var unreadCount = 0;

        if (ds.Tables.Count > 0)
        {
            foreach (DataRow row in ds.Tables[0].Rows)
            {
                items.Add(new
                {
                    id = Convert.ToInt64(row["id"]),
                    notificationId = Convert.ToInt64(row["notificationId"]),
                    userId = row["userId"]?.ToString(),
                    targetRole = row["targetRole"]?.ToString(),
                    senderUser = row["senderUser"]?.ToString(),
                    title = row["title"]?.ToString(),
                    message = row["message"]?.ToString(),
                    notificationType = row["notificationType"]?.ToString(),
                    referenceId = row["referenceId"]?.ToString(),
                    priority = row["priority"]?.ToString(),
                    isRead = Convert.ToBoolean(row["isRead"]),
                    createdAt = Convert.ToDateTime(row["createdAt"]),
                    readAt = row["readAt"] != DBNull.Value ? Convert.ToDateTime(row["readAt"]) : (DateTime?)null
                });
            }
        }

        if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
        {
            unreadCount = Convert.ToInt32(ds.Tables[1].Rows[0]["UnreadCount"]);
        }
        else
        {
            unreadCount = items.Count(x =>
            {
                var r = (dynamic)x;
                return !r.isRead;
            });
        }

        return Ok(new
        {
            success = true,
            items,
            unreadCount
        });
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(long id)
    {
        var spParams = new[]
        {
            new SqlParameter("@NotificationID", SqlDbType.BigInt) { Value = id }
        };

        await _dba.ExecuteCommandAsync("[dbo].[Mark_Notification_Read]", spParams);
        return Ok(new { success = true, notificationId = id });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userName = HttpContext.Session.GetString("UserName")
                    ?? HttpContext.Session.GetString("LoginID")
                    ?? Request.Headers["X-UserName"].FirstOrDefault()
                    ?? "Guest";

        var roleName = HttpContext.Session.GetString("UserRole")
                    ?? Request.Headers["X-User-Role"].FirstOrDefault()
                    ?? "";

        var spParams = new[]
        {
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName },
            new SqlParameter("@RoleName", SqlDbType.NVarChar, 100) { Value = (object?)roleName ?? DBNull.Value }
        };

        await _dba.ExecuteCommandAsync("[dbo].[Mark_All_Notifications_Read]", spParams);
        return Ok(new { success = true });
    }

    public class SendNotificationDto
    {
        public string UserID { get; set; } = "ALL";
        public string? TargetRole { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? NotificationType { get; set; } = "General";
        public string? ReferenceID { get; set; }
        public string? Priority { get; set; } = "NORMAL";
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
    {
        var senderUser = HttpContext.Session.GetString("UserName")
                      ?? Request.Headers["X-UserName"].FirstOrDefault()
                      ?? "System";

        var spParams = new[]
        {
            new SqlParameter("@UserID", SqlDbType.NVarChar, 100) { Value = dto.UserID },
            new SqlParameter("@TargetRole", SqlDbType.NVarChar, 100) { Value = (object?)dto.TargetRole ?? DBNull.Value },
            new SqlParameter("@SenderUser", SqlDbType.NVarChar, 100) { Value = senderUser },
            new SqlParameter("@Title", SqlDbType.NVarChar, 150) { Value = dto.Title },
            new SqlParameter("@Message", SqlDbType.NVarChar, 500) { Value = dto.Message },
            new SqlParameter("@NotificationType", SqlDbType.VarChar, 50) { Value = dto.NotificationType ?? "General" },
            new SqlParameter("@ReferenceID", SqlDbType.NVarChar, 100) { Value = (object?)dto.ReferenceID ?? DBNull.Value },
            new SqlParameter("@Priority", SqlDbType.VarChar, 20) { Value = dto.Priority ?? "NORMAL" }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Create_Notification]", spParams);
        return Ok(new { success = true, message = "Notification sent." });
    }
}
