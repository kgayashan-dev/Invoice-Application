using System.Security.Cryptography;
using System.Text;
using Isopoh.Cryptography.Argon2;

namespace backend.HelperClasses;

public static class CryptoHelper
{
    // HashType: 1=MD5, 2=BCrypt, 3=Argon2 (default)
    public static string PasswordHash(string password, int hashType = 3)
    {
        return hashType switch
        {
            1 => MD5Hash(password),
            2 => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12),
            3 => Argon2.Hash(password),
            _ => Argon2.Hash(password)
        };
    }

    public static bool PasswordVerify(string password, string storedHash, int hashType = 3)
    {
        if (string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(password))
            return false;

        try
        {
            if (storedHash.StartsWith("$argon2"))
            {
                return Argon2.Verify(storedHash, password);
            }

            if (storedHash.StartsWith("$2a$") || storedHash.StartsWith("$2b$") || storedHash.StartsWith("$2y$"))
            {
                return BCrypt.Net.BCrypt.Verify(password, storedHash);
            }

            return hashType switch
            {
                1 => string.Equals(storedHash, MD5Hash(password), StringComparison.OrdinalIgnoreCase),
                2 => BCrypt.Net.BCrypt.Verify(password, storedHash),
                3 => Argon2.Verify(storedHash, password),
                _ => false
            };
        }
        catch
        {
            return false;
        }
    }

    private static string MD5Hash(string input)
    {
        using var md5 = MD5.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hashBytes = md5.ComputeHash(bytes);
        var sb = new StringBuilder(hashBytes.Length * 2);
        foreach (var b in hashBytes)
            sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}
