namespace backend.Models;

public class User
{
    public string LoginID { get; set; } = Guid.NewGuid().ToString().ToUpper();
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? ContactNumber { get; set; }
    public string? NIC { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string RoleName { get; set; } = "User"; // "System Administrator", "Manager", "User"
    public bool IsLockedOut { get; set; } = false;
    public bool IsLockedPermanently { get; set; } = false;
    public int FailedLoginAttemptCount { get; set; } = 0;
    public DateTime? LastFailedLoginDate { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public string? LoginMessage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
