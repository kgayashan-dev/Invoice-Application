using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly DBAccess _dba;

    public AuthController(DBAccess dba)
    {
        _dba = dba;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// POST api/Auth/login
    /// Calls [dbo].[getUserLoginDetails], validates Argon2/BCrypt hash,
    /// calls [dbo].[RegisterFailedLoginAttempt] or [dbo].[RegisterSuccessfulLogin].
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var userName = request.Username.Trim();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        // 1. Call Stored Procedure [dbo].[getUserLoginDetails]
        var spParams = new[]
        {
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName }
        };

        var dt = await _dba.GetDataAsync("[dbo].[getUserLoginDetails]", spParams);

        if (dt == null || dt.Rows.Count == 0)
        {
            return Unauthorized(new { message = "Invalid Username or Password." });
        }

        var row = dt.Rows[0];
        var isLockedOut = row["IsLockedOut"] != DBNull.Value && Convert.ToBoolean(row["IsLockedOut"]);
        var isLockedPermanently = row["IsLockedPermanently"] != DBNull.Value && Convert.ToBoolean(row["IsLockedPermanently"]);
        var loginMessage = row["LoginMessage"]?.ToString();
        var storedHash = row["PasswordHash"]?.ToString();
        var isActive = row["IsActive"] == DBNull.Value || Convert.ToBoolean(row["IsActive"]);

        if (isLockedOut || isLockedPermanently)
        {
            return Unauthorized(new { message = !string.IsNullOrWhiteSpace(loginMessage) ? loginMessage : "Account is locked. Please contact administrator." });
        }

        if (!isActive)
        {
            return Unauthorized(new { message = "Account is inactive. Please contact administrator." });
        }

        // 2. Validate Password via Argon2id / BCrypt
        var isValid = CryptoHelper.PasswordVerify(request.Password, storedHash ?? "", 3);

        if (!isValid)
        {
            // Call Stored Procedure [dbo].[RegisterFailedLoginAttempt]
            var failParams = new[]
            {
                new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName },
                new SqlParameter("@MaxFailedAttempts", SqlDbType.Int) { Value = 5 },
                new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
            };
            await _dba.ExecuteCommandAsync("[dbo].[RegisterFailedLoginAttempt]", failParams);

            // Re-check lockout status
            var checkDt = await _dba.GetDataAsync("[dbo].[getUserLoginDetails]", spParams);
            var isNowLocked = checkDt.Rows.Count > 0 && checkDt.Rows[0]["IsLockedOut"] != DBNull.Value && Convert.ToBoolean(checkDt.Rows[0]["IsLockedOut"]);

            return Unauthorized(new
            {
                message = isNowLocked
                    ? "Account locked due to 5 consecutive failed login attempts."
                    : "Invalid Username or Password."
            });
        }

        // 3. Password valid: Call Stored Procedure [dbo].[RegisterSuccessfulLogin]
        var successParams = new[]
        {
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };
        await _dba.ExecuteCommandAsync("[dbo].[RegisterSuccessfulLogin]", successParams);

        var loginID = row["LoginID"]?.ToString() ?? "";
        var fullName = row["FullName"]?.ToString() ?? userName;
        var displayName = row["DisplayName"]?.ToString() ?? fullName;
        var email = row["Email"]?.ToString() ?? "";
        var roleName = row["RoleName"]?.ToString() ?? "User";

        return Ok(new
        {
            message = "Login successful.",
            user = new[]
            {
                new
                {
                    loginID,
                    userName,
                    fullName,
                    displayName,
                    email,
                    roleName,
                    isLockedOut = false,
                    isLockedPermanently = false,
                    lastLoginDate = DateTime.UtcNow
                }
            }
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userName = Request.Headers["X-UserName"].FirstOrDefault() ?? "Unknown";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName },
            new SqlParameter("@Action", SqlDbType.NVarChar, 100) { Value = "LOGOUT" },
            new SqlParameter("@Module", SqlDbType.NVarChar, 100) { Value = "AUTH" },
            new SqlParameter("@Details", SqlDbType.NVarChar) { Value = "User logged out." },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        try
        {
            await _dba.ExecuteCommandAsync("[dbo].[Log_Audit_Trail]", spParams);
        }
        catch
        {
            // fallback
        }

        return Ok(new { success = true });
    }

    [HttpGet("isAuthenticated")]
    [HttpPost("isAuthenticated")]
    public IActionResult IsAuthenticated()
    {
        return Ok(new { authenticated = true });
    }

    public class MenuRequest
    {
        public string? MenuId { get; set; }
        public string? LoginID { get; set; }
    }

    /// <summary>
    /// POST api/Auth/GetMenuID
    /// Calls [dbo].[GetMenuID] stored procedure
    /// </summary>
    [HttpPost("GetMenuID")]
    public async Task<IActionResult> GetMenuID([FromBody] MenuRequest? request)
    {
        var userName = Request.Headers["X-UserName"].FirstOrDefault() ?? request?.LoginID;
        var spParams = new[]
        {
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 100) { Value = (object?)userName ?? DBNull.Value },
            new SqlParameter("@MenuID", SqlDbType.Int) { Value = 0 }
        };

        var dt = await _dba.GetDataAsync("[dbo].[GetMenuID]", spParams);
        var menuList = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            menuList.Add(new
            {
                functionID = Convert.ToInt32(row["FunctionID"]),
                functionName = row["FunctionName"]?.ToString() ?? "",
                navigationURL = row["NavigationURL"]?.ToString() ?? "",
                displayOrder = Convert.ToInt32(row["DisplayOrder"]),
                module = row["Module"]?.ToString() ?? "Administration"
            });
        }

        return Ok(menuList);
    }
}
