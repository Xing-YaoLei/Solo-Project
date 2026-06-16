using ElderCareScheduling.API.Repositories;
using ElderCareScheduling.API.Services;
using Hangfire;

namespace ElderCareScheduling.API.Hangfire;

public class HangfireJobService : IHangfireJobService
{
    private readonly IServiceProvider _serviceProvider;

    public HangfireJobService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void RegisterRecurringJobs()
    {
        RecurringJob.AddOrUpdate(
            "schedule-status-check",
            () => ScheduleStatusCheckAsync(),
            Cron.Hourly,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

        RecurringJob.AddOrUpdate(
            "exception-reminder-check",
            () => ExceptionReminderCheckAsync(),
            Cron.HourInterval(2),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

        RecurringJob.AddOrUpdate(
            "daily-statistics-summary",
            () => DailyStatisticsSummaryAsync(),
            Cron.Daily(2),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });
    }

    public async Task ScheduleStatusCheckAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var pendingSchedules = await unitOfWork.Schedules.GetAllAsync();
        var now = DateTime.Now;

        foreach (var schedule in pendingSchedules)
        {
            if (schedule.Status == Enums.ScheduleStatus.ReviewApproved &&
                schedule.StartDate <= now &&
                schedule.EndDate >= now)
            {
                schedule.Status = Enums.ScheduleStatus.InProgress;
                schedule.StartedAt = now;
                schedule.UpdatedAt = now;
                unitOfWork.Schedules.Update(schedule);
            }
            else if (schedule.Status == Enums.ScheduleStatus.InProgress &&
                     schedule.EndDate < now)
            {
                schedule.Status = Enums.ScheduleStatus.Completed;
                schedule.CompletedAt = now;
                schedule.UpdatedAt = now;
                unitOfWork.Schedules.Update(schedule);
            }
        }

        await unitOfWork.CompleteAsync();
    }

    public async Task ExceptionReminderCheckAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var exceptions = await unitOfWork.ExceptionRecords.GetAllAsync();
        var now = DateTime.Now;

        var pendingExceptions = exceptions
            .Where(e => e.Status != Enums.ExceptionStatus.ClosedNormal &&
                        e.Status != Enums.ExceptionStatus.ClosedWithSupplement &&
                        e.Status != Enums.ExceptionStatus.ClosedEscalated)
            .ToList();

        foreach (var exc in pendingExceptions)
        {
            if (exc.SupplementDueDate.HasValue &&
                exc.Status == Enums.ExceptionStatus.PendingSupplement &&
                exc.SupplementDueDate.Value < now &&
                !exc.SupplementReceived)
            {
                exc.SupplementRequirement += $"\n[系统提醒] 补充材料已逾期，请尽快提交。";
                exc.UpdatedAt = now;
                unitOfWork.ExceptionRecords.Update(exc);
            }

            if (exc.Status == Enums.ExceptionStatus.Reported &&
                (now - exc.CreatedAt).TotalHours > 24 &&
                string.IsNullOrWhiteSpace(exc.AssignedTo))
            {
                exc.SupplementRequirement = "[系统提醒] 异常已报告超过24小时未指派处理人，请尽快处理。";
                exc.UpdatedAt = now;
                unitOfWork.ExceptionRecords.Update(exc);
            }
        }

        await unitOfWork.CompleteAsync();
    }

    public async Task DailyStatisticsSummaryAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var statisticsService = scope.ServiceProvider.GetRequiredService<IStatisticsService>();

        var today = DateTime.Today;
        var query = new Models.DTOs.StatisticsQueryDto
        {
            StartDate = today.AddDays(-1),
            EndDate = today.AddSeconds(-1)
        };

        var stats = await statisticsService.GetOverviewStatisticsAsync(query);

        await Task.CompletedTask;
    }
}
