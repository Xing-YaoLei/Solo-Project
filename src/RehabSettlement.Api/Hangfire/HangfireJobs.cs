using Hangfire;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Hangfire;

public static class ExceptionHandlingJob
{
    public static Task CheckExceptionStatus()
    {
        return Task.CompletedTask;
    }
}

public static class NotificationJob
{
    public static Task SendReminders()
    {
        return Task.CompletedTask;
    }
}

public static class HangfireJobScheduler
{
    public static void ScheduleJobs()
    {
        RecurringJob.AddOrUpdate("daily-exception-check", 
            () => ExceptionHandlingJob.CheckExceptionStatus(), 
            Cron.Daily(8, 0), 
            TimeZoneInfo.Local);

        RecurringJob.AddOrUpdate("reminder-notifications", 
            () => NotificationJob.SendReminders(), 
            Cron.HourInterval(2), 
            TimeZoneInfo.Local);
    }
}
