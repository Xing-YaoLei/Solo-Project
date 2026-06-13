using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using FitnessDietTracker.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FitnessDietTracker.API.BackgroundJobs;

public class CheckInJobService : ICheckInJobService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckInJobService> _logger;
    private readonly INotificationService _notificationService;

    public CheckInJobService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<CheckInJobService> logger,
        INotificationService notificationService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task CheckAndNotifyInterruptionsAsync()
    {
        _logger.LogInformation("开始检查打卡中断情况: {Time}", DateTime.Now);

        var thresholdDays = int.Parse(_configuration["AppSettings:CheckInInterruptionThresholdDays"] ?? "1");
        var today = DateTime.Today;

        var activeUsers = await _context.Users
            .Where(u => u.IsActive && u.Role == UserRole.Client)
            .Include(u => u.Coach)
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
                        Reason = $"系统检测：连续 {daysWithoutCheckIn} 天未打卡",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.CheckInInterruptions.Add(interruption);
                    await _context.SaveChangesAsync();

                    var log = new InterruptionLog
                    {
                        InterruptionId = interruption.Id,
                        ActionType = "系统检测到打卡中断",
                        Reason = $"连续 {daysWithoutCheckIn} 天未打卡",
                        OperatorId = 0,
                        CreatedAt = DateTime.UtcNow,
                        Remarks = "Hangfire 定时任务自动检测生成"
                    };
                    _context.InterruptionLogs.Add(log);

                    if (user.CoachId.HasValue && user.CoachId.Value > 0)
                    {
                        var title = $"⚠️ 学员「{user.UserName}」打卡中断提醒";
                        var content = $"学员 {user.UserName} 已连续 {daysWithoutCheckIn} 天未打卡饮食记录，请及时关注并跟进处理。\n中断起始日期：{interruption.StartDate:yyyy-MM-dd}";

                        await _notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = user.CoachId.Value,
                            Type = NotificationType.CheckInInterruption,
                            Title = title,
                            Content = content,
                            RelatedId = interruption.Id,
                            RelatedType = "CheckInInterruption",
                            CreatedBy = 0
                        });

                        _logger.LogInformation(
                            "已向教练 {CoachName} (ID: {CoachId}) 发送学员 {UserName} 的打卡中断通知",
                            user.Coach?.UserName, user.CoachId, user.UserName);
                    }

                    _logger.LogInformation(
                        "用户 {UserName} (ID: {UserId}) 已连续 {Days} 天未打卡，已创建中断提醒并通知负责人",
                        user.UserName, user.Id, daysWithoutCheckIn);
                }
                else
                {
                    existingInterruption.MissedDays = daysWithoutCheckIn;
                    existingInterruption.UpdatedAt = DateTime.UtcNow;

                    var hasRecentReminder = await _context.Notifications
                        .AnyAsync(n => n.UserId == user.CoachId
                            && n.RelatedId == existingInterruption.Id
                            && n.RelatedType == "CheckInInterruption"
                            && n.CreatedAt >= DateTime.UtcNow.AddDays(-1));

                    if (!hasRecentReminder && user.CoachId.HasValue && user.CoachId.Value > 0)
                    {
                        var title = $"⚠️ 学员「{user.UserName}」打卡中断持续提醒";
                        var content = $"学员 {user.UserName} 打卡中断已持续 {daysWithoutCheckIn} 天，目前仍未恢复打卡，请尽快跟进。";

                        await _notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = user.CoachId.Value,
                            Type = NotificationType.Reminder,
                            Title = title,
                            Content = content,
                            RelatedId = existingInterruption.Id,
                            RelatedType = "CheckInInterruption",
                            CreatedBy = 0
                        });
                    }
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("打卡中断检查完成: {Time}", DateTime.Now);
    }
}
