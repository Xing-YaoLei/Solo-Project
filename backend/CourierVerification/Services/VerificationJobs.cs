using CourierVerification.Data;
using CourierVerification.Enums;
using CourierVerification.Models;
using Microsoft.EntityFrameworkCore;

namespace CourierVerification.Services;

public static class VerificationJobs
{
    public static async Task SendOverdueCheck()
    {
        using var scope = JobContext.ServiceProvider?.CreateScope();
        if (scope == null) return;
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.Now;
        var threshold = now.AddHours(-24);
        var overdue = await db.VerificationRecords
            .Where(v => (v.Status == VerificationStatus.Pending || v.Status == VerificationStatus.Assigned || v.Status == VerificationStatus.InProgress) && v.CreatedAt < threshold)
            .ToListAsync();
        foreach (var r in overdue)
        {
            r.Status = VerificationStatus.Overdue;
            r.UpdatedAt = now;
            db.TimePoints.Add(new TimePoint { Id = Guid.NewGuid(), VerificationRecordId = r.Id, PointType = "OverdueMarked", PointTime = now, OperatorId = "System", OperatorName = "系统", Description = "系统自动标记超时" });
        }
        await db.SaveChangesAsync();
    }

    public static async Task DailyReportGeneration()
    {
        using var scope = JobContext.ServiceProvider?.CreateScope();
        if (scope == null) return;
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var today = DateTimeOffset.Now.Date;
        var yesterday = today.AddDays(-1);
        var records = await db.VerificationRecords.Where(v => v.CreatedAt >= yesterday && v.CreatedAt < today).ToListAsync();
        Console.WriteLine($"[DailyReport] {yesterday:yyyy-MM-dd}: Total={records.Count}, Confirmed={records.Count(r => r.Status == VerificationStatus.Confirmed)}, Damaged={records.Count(r => r.Status == VerificationStatus.Damaged)}");
    }

    public static async Task AutoCloseExpiredRecords()
    {
        using var scope = JobContext.ServiceProvider?.CreateScope();
        if (scope == null) return;
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.Now;
        var threshold = now.AddDays(-7);
        var expired = await db.VerificationRecords.Where(v => v.Status == VerificationStatus.Confirmed && v.UpdatedAt < threshold).ToListAsync();
        foreach (var r in expired)
        {
            r.Status = VerificationStatus.Closed;
            r.ClosedAt = now;
            r.UpdatedAt = now;
            db.TimePoints.Add(new TimePoint { Id = Guid.NewGuid(), VerificationRecordId = r.Id, PointType = "AutoClosed", PointTime = now, OperatorId = "System", OperatorName = "系统", Description = "自动关闭超过7天的已确认记录" });
        }
        await db.SaveChangesAsync();
    }
}

public static class JobContext
{
    public static IServiceProvider? ServiceProvider { get; set; }
}
