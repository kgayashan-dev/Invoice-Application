namespace backend.Models;

public class AuditTrail
{
    public long Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserName { get; set; } = "System";
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
}
