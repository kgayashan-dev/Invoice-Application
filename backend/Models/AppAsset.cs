namespace backend.Models;

public class AppAsset
{
    public int Id { get; set; }
    public string AssetType { get; set; } = string.Empty; // "Logo" or "Signature"
    public string Name { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "image/png";
    public string ImageData { get; set; } = string.Empty; // Base64 data URL
    public bool IsDefault { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
