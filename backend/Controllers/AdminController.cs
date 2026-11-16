using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.LoginID,
                u.UserName,
                u.FullName,
                u.DisplayName,
                u.Email,
                u.ContactNumber,
                u.NIC,
                u.RoleName,
                u.IsLockedOut,
                u.IsLockedPermanently,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginDate
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginID == id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(user);
    }

    public class InsertOrUpdateUserDto
    {
        public string Action { get; set; } = "I"; // "I" or "U"
        public string? LoginID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? ContactNumber { get; set; }
        public string? NIC { get; set; }
        public string? Password { get; set; }
        public string? RoleName { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpPost("InsertOrUpdate_User")]
    public async Task<IActionResult> InsertOrUpdate_User([FromBody] InsertOrUpdateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName))
            return BadRequest(new { message = "UserName is required." });

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";

        if (dto.Action.Equals("I", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Password is required for new user." });

            var existing = await _context.Users.AnyAsync(u => u.UserName == dto.UserName.Trim());
            if (existing)
                return BadRequest(new { message = $"Username '{dto.UserName}' already exists." });

            var newUser = new User
            {
                LoginID = Guid.NewGuid().ToString().ToUpper(),
                UserName = dto.UserName.Trim(),
                FullName = dto.FullName.Trim(),
                DisplayName = dto.DisplayName ?? dto.FullName.Trim(),
                Email = dto.Email?.Trim(),
                ContactNumber = dto.ContactNumber?.Trim(),
                NIC = dto.NIC?.Trim(),
                RoleName = string.IsNullOrWhiteSpace(dto.RoleName) ? "User" : dto.RoleName.Trim(),
                PasswordHash = CryptoHelper.PasswordHash(dto.Password.Trim(), 3),
                IsActive = dto.IsActive ?? true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            _context.AuditTrails.Add(new AuditTrail
            {
                UserName = operatorUser,
                Action = "CREATE_USER",
                Module = "ADMIN_USERS",
                Details = $"Created user '{newUser.UserName}' with role '{newUser.RoleName}'",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "User created successfully.", user = newUser });
        }
        else
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginID == dto.LoginID || u.UserName == dto.UserName);
            if (user == null)
                return NotFound(new { message = "User to update not found." });

            user.FullName = dto.FullName.Trim();
            user.DisplayName = dto.DisplayName ?? dto.FullName.Trim();
            user.Email = dto.Email?.Trim();
            user.ContactNumber = dto.ContactNumber?.Trim();
            user.NIC = dto.NIC?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.RoleName))
                user.RoleName = dto.RoleName.Trim();
            if (dto.IsActive.HasValue)
                user.IsActive = dto.IsActive.Value;
            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = CryptoHelper.PasswordHash(dto.Password.Trim(), 3);
            user.UpdatedAt = DateTime.UtcNow;

            _context.AuditTrails.Add(new AuditTrail
            {
                UserName = operatorUser,
                Action = "UPDATE_USER",
                Module = "ADMIN_USERS",
                Details = $"Updated user '{user.UserName}'",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "User updated successfully.", user });
        }
    }

    public class LockRequest
    {
        public string LoginID { get; set; } = string.Empty;
        public bool Lock { get; set; }
        public string? Reason { get; set; }
    }

    [HttpPost("ToggleLockUser")]
    public async Task<IActionResult> ToggleLockUser([FromBody] LockRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginID == req.LoginID);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";

        user.IsLockedOut = req.Lock;
        user.LoginMessage = req.Lock ? (req.Reason ?? "Account locked by Administrator.") : null;
        if (!req.Lock)
        {
            user.FailedLoginAttemptCount = 0;
        }

        _context.AuditTrails.Add(new AuditTrail
        {
            UserName = operatorUser,
            Action = req.Lock ? "LOCK_USER" : "UNLOCK_USER",
            Module = "ADMIN_USERS",
            Details = $"User '{user.UserName}' {(req.Lock ? "locked" : "unlocked")}. Reason: {req.Reason ?? "N/A"}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = $"User {(req.Lock ? "locked" : "unlocked")} successfully." });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.UserRoles.Where(r => r.IsActive).ToListAsync();
        return Ok(roles);
    }

    public class AssignRoleRequest
    {
        public string LoginID { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    [HttpPost("AssignRole")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginID == req.LoginID);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var oldRole = user.RoleName;
        user.RoleName = req.RoleName;
        user.UpdatedAt = DateTime.UtcNow;

        _context.AuditTrails.Add(new AuditTrail
        {
            UserName = operatorUser,
            Action = "ASSIGN_ROLE",
            Module = "ADMIN_ROLES",
            Details = $"Changed role for '{user.UserName}' from '{oldRole}' to '{req.RoleName}'",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Role assigned successfully." });
    }
}
