using System.Data;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using backend.HelperClasses;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly DBAccess _dba;

    public AssetsController(DBAccess dba)
    {
        _dba = dba;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssets([FromQuery] string? type)
    {
        var spParams = new[]
        {
            new SqlParameter("@AssetType", SqlDbType.NVarChar, 50)
            {
                Value = string.IsNullOrWhiteSpace(type) ? DBNull.Value : (object)type
            }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Get_App_Assets]", spParams);
        var list = new List<object>();

        foreach (DataRow row in dt.Rows)
        {
            list.Add(new
            {
                id = Convert.ToInt32(row["Id"]),
                assetType = row["AssetType"]?.ToString(),
                name = row["Name"]?.ToString(),
                fileName = row["FileName"]?.ToString(),
                contentType = row["ContentType"]?.ToString(),
                imageData = row["ImageData"]?.ToString(),
                isDefault = Convert.ToBoolean(row["IsDefault"]),
                uploadedBy = row["UploadedBy"]?.ToString(),
                createdAt = Convert.ToDateTime(row["CreatedAt"])
            });
        }

        return Ok(list);
    }

    public class UploadAssetDto
    {
        public string AssetType { get; set; } = "Logo"; // "Logo" or "Signature"
        public string Name { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "image/png";
        public string ImageData { get; set; } = string.Empty; // Base64 data URL
        public bool IsDefault { get; set; } = false;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadAsset([FromBody] UploadAssetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ImageData))
            return BadRequest(new { message = "Image data is required." });

        if (string.IsNullOrWhiteSpace(dto.Name))
            dto.Name = dto.FileName ?? (dto.AssetType + " - " + DateTime.UtcNow.ToString("yyyyMMdd"));

        var operatorUser = Request.Headers["X-UserName"].FirstOrDefault() ?? "Admin";

        var spParams = new[]
        {
            new SqlParameter("@AssetType", SqlDbType.NVarChar, 50) { Value = dto.AssetType },
            new SqlParameter("@Name", SqlDbType.NVarChar, 200) { Value = dto.Name },
            new SqlParameter("@FileName", SqlDbType.NVarChar, 250) { Value = string.IsNullOrWhiteSpace(dto.FileName) ? "upload.png" : dto.FileName },
            new SqlParameter("@ContentType", SqlDbType.NVarChar, 100) { Value = dto.ContentType ?? "image/png" },
            new SqlParameter("@ImageData", SqlDbType.NVarChar, -1) { Value = dto.ImageData },
            new SqlParameter("@IsDefault", SqlDbType.Bit) { Value = dto.IsDefault },
            new SqlParameter("@UploadedBy", SqlDbType.NVarChar, 100) { Value = operatorUser }
        };

        var dt = await _dba.GetDataAsync("[dbo].[Insert_App_Asset]", spParams);
        var assetId = Convert.ToInt32(dt.Rows[0]["AssetId"]);

        return Ok(new
        {
            id = assetId,
            message = $"{dto.AssetType} uploaded successfully.",
            assetType = dto.AssetType,
            name = dto.Name
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(int id)
    {
        var spParams = new[]
        {
            new SqlParameter("@Id", SqlDbType.Int) { Value = id }
        };

        await _dba.GetDataAsync("[dbo].[Delete_App_Asset]", spParams);
        return Ok(new { success = true, message = "Asset deleted." });
    }

    [HttpPost("{id}/set-default")]
    public async Task<IActionResult> SetDefault(int id, [FromQuery] string assetType)
    {
        if (string.IsNullOrWhiteSpace(assetType))
            return BadRequest(new { message = "AssetType is required." });

        var spParams = new[]
        {
            new SqlParameter("@Id", SqlDbType.Int) { Value = id },
            new SqlParameter("@AssetType", SqlDbType.NVarChar, 50) { Value = assetType }
        };

        await _dba.GetDataAsync("[dbo].[Set_Default_App_Asset]", spParams);
        return Ok(new { success = true, message = "Set as default asset." });
    }
}
