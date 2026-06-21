using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Infrastructure.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(HearingCalendarDbContext dbContext)
    {
        await dbContext.Database.EnsureCreatedAsync();

        await SeedUsersAsync(dbContext);
    }

    private static async Task SeedUsersAsync(HearingCalendarDbContext dbContext)
    {
        if (await dbContext.Users.AnyAsync()) return;

        var users = new List<User>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Username = "partner",
                Email = "partner@example.com",
                FullName = "张合伙人",
                Role = UserRole.Partner,
                Department = "合伙人办公室",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Partner123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Username = "lawyer",
                Email = "lawyer@example.com",
                FullName = "李律师",
                Role = UserRole.Lawyer,
                Department = "诉讼部",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Lawyer123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Username = "assistant",
                Email = "assistant@example.com",
                FullName = "王助理",
                Role = UserRole.Assistant,
                Department = "行政部",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Assistant123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Username = "client",
                Email = "client@example.com",
                FullName = "赵客户",
                Role = UserRole.Client,
                Department = null,
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Client123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        await dbContext.Users.AddRangeAsync(users);
        await dbContext.SaveChangesAsync();
    }
}
