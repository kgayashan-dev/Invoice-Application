using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly DBAccess _dba;

    public AdminController(DBAccess dba)
    {
        _dba = dba;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var dt = await _dba.GetDataAsync("[dbo].[Get_All_Users]");
        var users = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            users.Add(new
            {
                loginID = row["LoginID"]?.ToString(),
                userName = row["UserName"]?.ToString(),
                fullName = row["FullName"]?.ToString(),
                displayName = row["DisplayName"]?.ToString(),
                email = row["Email"]?.ToString(),
                contactNumber = row["ContactNumber"]?.ToString(),
                nic = row["NIC"]?.ToString(),
                roleName = row["RoleName"]?.ToString(),
                isLockedOut = row["IsLockedOut"] != DBNull.Value && Convert.ToBoolean(row["IsLockedOut"]),
                isLockedPermanently = row["IsLockedPermanently"] != DBNull.Value && Convert.ToBoolean(row["IsLockedPermanently"]),
                isActive = row["IsActive"] == DBNull.Value || Convert.ToBoolean(row["IsActive"]),
                createdAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : (DateTime?)null,
                lastLoginDate = row["LastLoginDate"] != DBNull.Value ? Convert.ToDateTime(row["LastLoginDate"]) : (DateTime?)null
            });
        }

        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        var spParams = new[]
        {
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 50) { Value = id }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Get_User_By_Id]", spParams);
        if (dt == null || dt.Rows.Count == 0)
            return NotFound(new { message = "User not found." });

        var row = dt.Rows[0];
        var user = new
        {
            loginID = row["LoginID"]?.ToString(),
            userName = row["UserName"]?.ToString(),
            fullName = row["FullName"]?.ToString(),
            displayName = row["DisplayName"]?.ToString(),
            email = row["Email"]?.ToString(),
            contactNumber = row["ContactNumber"]?.ToString(),
            nic = row["NIC"]?.ToString(),
            roleName = row["RoleName"]?.ToString(),
            isLockedOut = row["IsLockedOut"] != DBNull.Value && Convert.ToBoolean(row["IsLockedOut"]),
            isLockedPermanently = row["IsLockedPermanently"] != DBNull.Value && Convert.ToBoolean(row["IsLockedPermanently"]),
            isActive = row["IsActive"] == DBNull.Value || Convert.ToBoolean(row["IsActive"]),
            createdAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : (DateTime?)null,
            lastLoginDate = row["LastLoginDate"] != DBNull.Value ? Convert.ToDateTime(row["LastLoginDate"]) : (DateTime?)null
        };

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
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        string? passwordHash = null;
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            passwordHash = CryptoHelper.PasswordHash(dto.Password.Trim(), 3);
        }
        else if (dto.Action.Equals("I", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Password is required for new user." });
        }

        var spParams = new[]
        {
            new SqlParameter("@Action", SqlDbType.Char, 1) { Value = dto.Action.ToUpperInvariant() },
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 50) { Value = (object?)dto.LoginID ?? DBNull.Value },
            new SqlParameter("@UserName", SqlDbType.NVarChar, 100) { Value = dto.UserName.Trim() },
            new SqlParameter("@FullName", SqlDbType.NVarChar, 200) { Value = dto.FullName.Trim() },
            new SqlParameter("@DisplayName", SqlDbType.NVarChar, 150) { Value = (object?)dto.DisplayName ?? DBNull.Value },
            new SqlParameter("@NIC", SqlDbType.VarChar, 20) { Value = (object?)dto.NIC ?? DBNull.Value },
            new SqlParameter("@ContactNumber", SqlDbType.NVarChar, 20) { Value = (object?)dto.ContactNumber ?? DBNull.Value },
            new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = (object?)dto.Email ?? DBNull.Value },
            new SqlParameter("@PasswordHash", SqlDbType.NVarChar, 500) { Value = (object?)passwordHash ?? DBNull.Value },
            new SqlParameter("@RoleName", SqlDbType.NVarChar, 100) { Value = string.IsNullOrWhiteSpace(dto.RoleName) ? "User" : dto.RoleName.Trim() },
            new SqlParameter("@IsActive", SqlDbType.Bit) { Value = dto.IsActive ?? true },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        try
        {
            var dt = await _dba.GetDataAsync("[dbo].[InsertOrUpdate_User]", spParams);
            var newId = dt.Rows.Count > 0 ? dt.Rows[0]["LoginID"]?.ToString() : dto.LoginID;
            var msg = dt.Rows.Count > 0 ? dt.Rows[0]["Message"]?.ToString() : "Operation completed successfully.";

            return Ok(new
            {
                success = true,
                message = msg,
                loginID = newId
            });
        }
        catch (SqlException ex)
        {
            return BadRequest(new { message = ex.Message });
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
        if (string.IsNullOrWhiteSpace(req.LoginID))
            return BadRequest(new { message = "LoginID is required." });

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 50) { Value = req.LoginID },
            new SqlParameter("@Lock", SqlDbType.Bit) { Value = req.Lock },
            new SqlParameter("@Reason", SqlDbType.NVarChar, 500) { Value = (object?)req.Reason ?? DBNull.Value },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        await _dba.ExecuteCommandAsync("[dbo].[ToggleLockUser]", spParams);

        return Ok(new
        {
            success = true,
            message = $"User {(req.Lock ? "locked" : "unlocked")} successfully."
        });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var dt = await _dba.GetDataAsync("[dbo].[Get_All_Roles]");
        var roles = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            roles.Add(new
            {
                roleId = Convert.ToInt32(row["RoleId"]),
                roleName = row["RoleName"]?.ToString(),
                description = row["Description"]?.ToString(),
                isActive = Convert.ToBoolean(row["IsActive"]),
                createdAt = row["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(row["CreatedAt"]) : (DateTime?)null
            });
        }

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
        if (string.IsNullOrWhiteSpace(req.LoginID) || string.IsNullOrWhiteSpace(req.RoleName))
            return BadRequest(new { message = "LoginID and RoleName are required." });

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@LoginID", SqlDbType.NVarChar, 50) { Value = req.LoginID },
            new SqlParameter("@RoleName", SqlDbType.NVarChar, 100) { Value = req.RoleName.Trim() },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        await _dba.ExecuteCommandAsync("[dbo].[Assign_User_Role]", spParams);

        return Ok(new
        {
            success = true,
            message = "Role assigned successfully."
        });
    }

    public class RoleWiseMenuAccessQueryDto
    {
        public int? RoleID { get; set; }
        public int? MenuID { get; set; }
        public int? IsActive { get; set; }
    }

    [HttpPost("GetRoleWiseMenuAccess")]
    public async Task<IActionResult> GetRoleWiseMenuAccess([FromBody] RoleWiseMenuAccessQueryDto? dto)
    {
        int roleId = dto?.RoleID ?? 1;

        var spParams = new[]
        {
            new SqlParameter("@RoleID", SqlDbType.Int) { Value = roleId }
        };

        var dt = await _dba.GetDataAsync("[dbo].[GetRoleWiseMenuAccess]", spParams);
        var list = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            list.Add(new
            {
                roleID = Convert.ToInt32(row["RoleID"]),
                roleName = row["RoleName"]?.ToString() ?? "",
                accessID = Convert.ToInt32(row["AccessID"]),
                functionID = Convert.ToInt32(row["FunctionID"]),
                menuID = Convert.ToInt32(row["MenuID"]),
                moduleID = Convert.ToInt32(row["ModuleID"]),
                moduleName = row["ModuleName"]?.ToString() ?? "",
                functionName = row["FunctionName"]?.ToString() ?? "",
                menuName = row["MenuName"]?.ToString() ?? "",
                navigationURL = row["NavigationURL"]?.ToString() ?? "",
                displayOrder = Convert.ToInt32(row["DisplayOrder"]),
                isActive = Convert.ToInt32(row["IsActive"])
            });
        }

        return Ok(list);
    }

    public class GrantOrRevokeRoleWiseMenuAccessDto
    {
        public int RoleID { get; set; }
        public int MenuID { get; set; }
        public int IsActive { get; set; }
    }

    [HttpPost("GrantOrRevokeRoleWiseMenuAccess")]
    public async Task<IActionResult> GrantOrRevokeRoleWiseMenuAccess([FromBody] GrantOrRevokeRoleWiseMenuAccessDto dto)
    {
        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var spParams = new[]
        {
            new SqlParameter("@RoleID", SqlDbType.Int) { Value = dto.RoleID },
            new SqlParameter("@MenuID", SqlDbType.Int) { Value = dto.MenuID },
            new SqlParameter("@IsActive", SqlDbType.Int) { Value = dto.IsActive },
            new SqlParameter("@Operator", SqlDbType.NVarChar, 100) { Value = operatorUser },
            new SqlParameter("@IPAddress", SqlDbType.VarChar, 50) { Value = ipAddress }
        };

        await _dba.ExecuteCommandAsync("[dbo].[GrantOrRevokeRoleWiseMenuAccess]", spParams);

        return Ok(new
        {
            success = true,
            message = $"Menu access {(dto.IsActive == 1 ? "granted" : "revoked")} successfully."
        });
    }

    public class GetUserRolesFilterDto
    {
        public int? RoleID { get; set; }
        public string? RoleName { get; set; }
        public int? IsActive { get; set; }
    }

    [HttpPost("GetUserRoles")]
    public async Task<IActionResult> GetUserRolesPost([FromBody] GetUserRolesFilterDto? dto)
    {
        return await GetRoles();
    }

    [HttpGet("GetUserRoles")]
    public async Task<IActionResult> GetUserRolesGet()
    {
        return await GetRoles();
    }
}
