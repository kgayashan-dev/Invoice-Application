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
            var checkParams = new[]
            {
                new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = userName }
            };
            var checkDt = await _dba.GetDataAsync("[dbo].[getUserLoginDetails]", checkParams);
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

        // Set ASP.NET Core session variables (matching SE-Group-Project)
        HttpContext.Session.SetString("LoginID", loginID);
        HttpContext.Session.SetString("UserName", userName);
        HttpContext.Session.SetString("UserRole", roleName);
        HttpContext.Session.SetString("FullName", fullName);
        HttpContext.Session.SetString("DisplayName", displayName);

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
        var userName = HttpContext.Session.GetString("UserName")
                    ?? HttpContext.Session.GetString("LoginID")
                    ?? Request.Headers["X-UserName"].FirstOrDefault()
                    ?? "Unknown";
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

        HttpContext.Session.Clear();

        Response.Cookies.Delete(".InvoiceApp.Session", new CookieOptions
        {
            Path = "/",
            Secure = HttpContext.Request.IsHttps,
            SameSite = HttpContext.Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax
        });

        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        return Ok(new { success = true, message = "You have been signed out successfully." });
    }

    [HttpGet("isAuthenticated")]
    [HttpPost("isAuthenticated")]
    public IActionResult IsAuthenticated()
    {
        var userId = HttpContext.Session.GetString("LoginID")
                  ?? HttpContext.Session.GetString("UserName")
                  ?? Request.Headers["X-UserName"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            return Ok(new
            {
                authenticated = true,
                message = "You are authenticated.",
                userName = userId,
                roleName = HttpContext.Session.GetString("UserRole") ?? Request.Headers["X-User-Role"].FirstOrDefault()
            });
        }

        return Unauthorized(new { authenticated = false, message = "You are not authenticated." });
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
        var userName = HttpContext.Session.GetString("LoginID")
                    ?? HttpContext.Session.GetString("UserName")
                    ?? Request.Headers["X-UserName"].FirstOrDefault()
                    ?? request?.LoginID;

        if (string.IsNullOrWhiteSpace(userName))
        {
            return Unauthorized(new { message = "User is not logged in." });
        }

        var rawMenuId = request?.MenuId ?? "0";
        if (!int.TryParse(rawMenuId, out var targetMenuId))
            targetMenuId = 0;

        var spParams = new[]
        {
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 100) { Value = userName },
            new SqlParameter("@MenuID", SqlDbType.Int) { Value = targetMenuId }
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
