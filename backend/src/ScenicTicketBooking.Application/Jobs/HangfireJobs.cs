using Hangfire;
using ScenicTicketBooking.Application.Services;

namespace ScenicTicketBooking.Application.Jobs;

public interface IHangfireJobs
{
    Task RunConflictDetectionJob();
    Task SendNotificationsJob();
    Task GenerateDailySummaryJob();
    Task GenerateMonthlyReportJob(int year, int month);
}

public class HangfireJobs : IHangfireJobs
{
    private readonly IConflictDetectionService _conflictDetection;
    private readonly INotificationService _notificationService;

    public HangfireJobs(
        IConflictDetectionService conflictDetection,
        INotificationService notificationService)
    {
        _conflictDetection = conflictDetection;
        _notificationService = notificationService;
    }

    [Queue("default")]
    [AutomaticRetry(Attempts = 3, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
    public async Task RunConflictDetectionJob()
    {
        await _conflictDetection.RunScheduledConflictDetectionAsync();
    }

    [Queue("default")]
    [AutomaticRetry(Attempts = 5, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
    public async Task SendNotificationsJob()
    {
        await _notificationService.SendPendingNotificationsAsync();
    }

    [Queue("default")]
    public async Task GenerateDailySummaryJob()
    {
        await Task.CompletedTask;
    }

    [Queue("default")]
    public async Task GenerateMonthlyReportJob(int year, int month)
    {
        await Task.CompletedTask;
    }
}

public static class HangfireJobScheduler
{
    public static void ScheduleRecurringJobs()
    {
        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "conflict-detection-15min",
            job => job.RunConflictDetectionJob(),
            "*/15 * * * *",
            TimeZoneInfo.Local);

        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "send-notifications-5min",
            job => job.SendNotificationsJob(),
            "*/5 * * * *",
            TimeZoneInfo.Local);

        RecurringJob.AddOrUpdate<IHangfireJobs>(
            "daily-summary-midnight",
            job => job.GenerateDailySummaryJob(),
            "0 0 * * *",
            TimeZoneInfo.Local);
    }
}
