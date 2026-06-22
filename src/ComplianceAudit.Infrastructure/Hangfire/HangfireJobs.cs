using Hangfire;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Hangfire;

public interface IHangfireJobs
{
    Task CheckOverdueRectificationsJob();
    Task GenerateDailyDigestJob();
    Task ArchiveClosedSchedulesJob();
    Task SendPendingRemindersJob();
}

public class HangfireJobs : IHangfireJobs
{
    private readonly IRectificationService _rectificationService;
    private readonly IServiceProvider _serviceProvider;

    public HangfireJobs(IRectificationService rectificationService, IServiceProvider serviceProvider)
    {
        _rectificationService = rectificationService;
        _serviceProvider = serviceProvider;
    }

    public async Task CheckOverdueRectificationsJob()
    {
        try
        {
            await _rectificationService.CheckOverdueRectifications();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Hangfire] CheckOverdueRectificationsJob failed: {ex.Message}");
            throw;
        }
    }

    public Task GenerateDailyDigestJob()
    {
        Console.WriteLine($"[Hangfire] GenerateDailyDigestJob executed at {DateTime.UtcNow}");
        return Task.CompletedTask;
    }

    public Task ArchiveClosedSchedulesJob()
    {
        Console.WriteLine($"[Hangfire] ArchiveClosedSchedulesJob executed at {DateTime.UtcNow}");
        return Task.CompletedTask;
    }

    public Task SendPendingRemindersJob()
    {
        Console.WriteLine($"[Hangfire] SendPendingRemindersJob executed at {DateTime.UtcNow}");
        return Task.CompletedTask;
    }
}

public static class HangfireJobScheduler
{
    public static void ScheduleRecurringJobs()
    {
        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "check-overdue-rectifications",
            job => job.CheckOverdueRectificationsJob(),
            Cron.Hourly);

        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "generate-daily-digest",
            job => job.GenerateDailyDigestJob(),
            Cron.Daily(8, 0));

        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "archive-closed-schedules",
            job => job.ArchiveClosedSchedulesJob(),
            Cron.Weekly(DayOfWeek.Sunday, 2, 0));

        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "send-pending-reminders",
            job => job.SendPendingRemindersJob(),
            Cron.Daily(9, 0));
    }
}
