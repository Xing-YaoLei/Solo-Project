using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FitnessDietTracker.API.BackgroundJobs;

public class CheckInJobService : ICheckInJobService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckInJobService> _logger;

    public CheckInJobService(AppDbContext context, IConfiguration configuration, ILogger<CheckInJobService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task CheckAndNotifyInterruptionsAsync()
    {
        _logger.LogInformation("开始检查打卡中断情况: {Time}", DateTime.Now);

        var thresholdDays = int.Parse(_configuration["AppSettings:CheckInInterruptionThresholdDays"] ?? "1");
        var today = DateTime.Today;
        var checkDate = today.AddDays(-thresholdDays);

        var activeUsers = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Client)
            .ToListAsync();

        foreach (var user in activeUsers)
        {
            var lastCheckIn = await _context.DietRecords
                .Where(d => d.UserId == user.Id)
                .OrderByDescending(d => d.RecordDate)
                .FirstOrDefaultAsync();

            var daysWithoutCheckIn = lastCheckIn != null
                ? (today - lastCheckIn.RecordDate.Date).Days
                : (today - user.CreatedAt.Date).Days;

            if (daysWithoutCheckIn > thresholdDays)
            {
                var existingInterruption = await _context.CheckInInterruptions
                    .FirstOrDefaultAsync(i => i.UserId == user.Id
                        && (i.Status == InterruptionStatus.Pending
                            || i.Status == InterruptionStatus.Processing));

                if (existingInterruption == null)
                {
                    var interruption = new CheckInInterruption
                    {
                        UserId = user.Id,
                        StartDate = lastCheckIn?.RecordDate.AddDays(1) ?? user.CreatedAt,
                        MissedDays = daysWithoutCheckIn,
                        Status = InterruptionStatus.Pending,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.CheckInInterruptions.Add(interruption);

                    var log = new InterruptionLog
                    {
                        Interruption = interruption,
                        ActionType = "系统检测到打卡中断",
                        Reason = $"连续 {daysWithoutCheckIn} 天未打卡",
                        OperatorId = 0,
                        CreatedAt = DateTime.UtcNow,
                        Remarks = "Hangfire 定时任务自动检测"
                    };
                    _context.InterruptionLogs.Add(log);

                    _logger.LogInformation(
                        "用户 {UserName} (ID: {UserId}) 已连续 {Days} 天未打卡，已创建中断提醒",
                        user.UserName, user.Id, daysWithoutCheckIn);
                }
                else
                {
                    existingInterruption.MissedDays = daysWithoutCheckIn;
                    existingInterruption.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("打卡中断检查完成: {Time}", DateTime.Now);
    }
}
