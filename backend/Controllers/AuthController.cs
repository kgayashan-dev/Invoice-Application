using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var userName = request.Username.Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == userName);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid Username or Password." });
        }

        if (user.IsLockedOut || user.IsLockedPermanently)
        {
            return Unauthorized(new { message = user.LoginMessage ?? "Account is locked. Please contact administrator." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Account is inactive. Please contact administrator." });
        }

        var isValidPassword = CryptoHelper.PasswordVerify(request.Password, user.PasswordHash, 3);

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (!isValidPassword)
        {
            user.FailedLoginAttemptCount += 1;
            user.LastFailedLoginDate = DateTime.UtcNow;

            if (user.FailedLoginAttemptCount >= 5)
            {
                user.IsLockedOut = true;
                user.LoginMessage = "Account locked due to 5 consecutive failed login attempts.";
            }

            _context.AuditTrails.Add(new AuditTrail
            {
                UserName = userName,
                Action = "LOGIN_FAILED",
                Module = "AUTH",
                Details = $"Failed attempt #{user.FailedLoginAttemptCount}",
                IpAddress = ipAddress
            });

            await _context.SaveChangesAsync();
            return Unauthorized(new { message = user.IsLockedOut ? user.LoginMessage : "Invalid Username or Password." });
        }

        // Login success: reset failure counter
        user.FailedLoginAttemptCount = 0;
        user.LastLoginDate = DateTime.UtcNow;

        _context.AuditTrails.Add(new AuditTrail
        {
            UserName = userName,
            Action = "LOGIN_SUCCESS",
            Module = "AUTH",
            Details = $"Logged in successfully. Role: {user.RoleName}",
            IpAddress = ipAddress
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Login successful.",
            user = new[]
            {
                new
                {
                    loginID = user.LoginID,
                    UserName = user.UserName,
                    FullName = user.FullName,
                    DisplayName = user.DisplayName ?? user.FullName,
                    Email = user.Email,
                    RoleName = user.RoleName,
                    IsLockedOut = user.IsLockedOut,
                    IsLockedPermanently = user.IsLockedPermanently,
                    LoginMessage = user.LoginMessage,
                    LastLoginDate = user.LastLoginDate
                }
            }
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userName = Request.Headers["X-UserName"].FirstOrDefault() ?? "Unknown";
        _context.AuditTrails.Add(new AuditTrail
        {
            UserName = userName,
            Action = "LOGOUT",
            Module = "AUTH",
            Details = "User logged out.",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("isAuthenticated")]
    public IActionResult IsAuthenticated()
    {
        var userHeader = Request.Headers["X-UserName"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(userHeader))
        {
            return Ok(new { authenticated = true });
        }
        return Ok(new { authenticated = true, user = userHeader });
    }

    public class MenuRequest
    {
        public string? MenuId { get; set; }
    }

    [HttpPost("GetMenuID")]
    public IActionResult GetMenuID([FromBody] MenuRequest? request)
    {
        // Standard administration & application menus matching My HR structure
        var menuItems = new[]
        {
            new { FunctionID = 1001, FunctionName = "Dashboard", NavigationURL = "/main", DisplayOrder = 1, Module = "Overview" },
            new { FunctionID = 1002, FunctionName = "Users", NavigationURL = "/main/users", DisplayOrder = 2, Module = "Administration" },
            new { FunctionID = 1008, FunctionName = "User Roles", NavigationURL = "/main/admin/roles", DisplayOrder = 3, Module = "Administration" },
            new { FunctionID = 1005, FunctionName = "Assign Roles", NavigationURL = "/main/admin/assign-roles", DisplayOrder = 4, Module = "Administration" },
            new { FunctionID = 2001, FunctionName = "Audit Trail", NavigationURL = "/main/audit", DisplayOrder = 5, Module = "Administration" },
            new { FunctionID = 3001, FunctionName = "Settings", NavigationURL = "/main/settings", DisplayOrder = 6, Module = "Administration" },
            new { FunctionID = 8001, FunctionName = "Invoices", NavigationURL = "/main/invoices", DisplayOrder = 7, Module = "Billing" },
        };

        return Ok(menuItems);
    }
}
