namespace backend.Models;

public class SystemSetting
{
    public int Id { get; set; }
    public string Category { get; set; } = "General";
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }
}
