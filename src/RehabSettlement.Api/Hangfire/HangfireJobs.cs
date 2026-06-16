using Hangfire;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Hangfire;

public class ExceptionHandlingJob
{
    private readonly IExceptionService _exceptionService;

    public ExceptionHandlingJob(IExceptionService exceptionService)
    {
        _exceptionService = exceptionService;
    }

    public async Task CheckExceptionStatus()
    {
        await _exceptionService.CheckAndEscalateOverdueAsync();
    }
}

public class NotificationJob
{
    public Task SendReminders()
    {
        return Task.CompletedTask;
    }
}

public static class HangfireJobScheduler
{
    public static void ScheduleJobs()
    {
        RecurringJob.AddOrUpdate<ExceptionHandlingJob>(
            "daily-exception-check",
            job => job.CheckExceptionStatus(),
            Cron.Daily(8, 0),
            TimeZoneInfo.Local);

        RecurringJob.AddOrUpdate<NotificationJob>(
            "reminder-notifications",
            job => job.SendReminders(),
            Cron.HourInterval(2),
            TimeZoneInfo.Local);
    }
}
