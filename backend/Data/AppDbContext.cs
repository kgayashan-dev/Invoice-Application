using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.HelperClasses;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<AuditTrail> AuditTrails => Set<AuditTrail>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CustomerEmail).HasMaxLength(200);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);

            entity.HasMany(e => e.Items)
                  .WithOne(i => i.Invoice)
                  .HasForeignKey(i => i.InvoiceId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(250);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.LoginID);
            entity.HasIndex(e => e.UserName).IsUnique();
            entity.Property(e => e.LoginID).HasMaxLength(50);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.RoleName).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.RoleId);
            entity.Property(e => e.RoleName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(300);
        });

        modelBuilder.Entity<AuditTrail>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Module).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Category, e.SettingKey }).IsUnique();
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SettingKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SettingValue).IsRequired().HasMaxLength(500);
        });
    }

    public void SeedDefaults()
    {
        // Seed default roles if not present
        if (!UserRoles.Any())
        {
            UserRoles.AddRange(
                new UserRole { RoleId = 1, RoleName = "System Administrator", Description = "Full system administration and settings access." },
                new UserRole { RoleId = 2, RoleName = "Finance Manager", Description = "Manage invoices, approvals, and financial reports." },
                new UserRole { RoleId = 3, RoleName = "Billing Officer", Description = "Create and process customer invoices." },
                new UserRole { RoleId = 4, RoleName = "User", Description = "Standard application viewer access." }
            );
            SaveChanges();
        }

        // Seed default system admin user
        if (!Users.Any(u => u.UserName == "admin"))
        {
            var adminUser = new User
            {
                LoginID = "05DC726C-6DDD-4C80-A06E-05EDEDCC8CE3",
                UserName = "admin",
                FullName = "System Administrator",
                DisplayName = "Administrator",
                Email = "admin@example.com",
                RoleName = "System Administrator",
                PasswordHash = CryptoHelper.PasswordHash("Admin@123", 3),
                IsActive = true,
                IsLockedOut = false,
                CreatedAt = DateTime.UtcNow
            };
            Users.Add(adminUser);
            SaveChanges();
        }

        // Seed default system settings
        if (!SystemSettings.Any())
        {
            SystemSettings.AddRange(
                new SystemSetting { Category = "Company", SettingKey = "CompanyName", SettingValue = "Invoice Application Enterprise", Description = "Organization Legal Name" },
                new SystemSetting { Category = "Company", SettingKey = "CompanyEmail", SettingValue = "billing@invoiceapp.com", Description = "Primary Billing Email" },
                new SystemSetting { Category = "Invoicing", SettingKey = "InvoicePrefix", SettingValue = "INV-", Description = "Prefix for generated invoices" },
                new SystemSetting { Category = "Invoicing", SettingKey = "DefaultCurrency", SettingValue = "USD", Description = "Default billing currency symbol or code" },
                new SystemSetting { Category = "Security", SettingKey = "MaxFailedLogins", SettingValue = "5", Description = "Attempts before lockout" }
            );
            SaveChanges();
        }
    }
}
