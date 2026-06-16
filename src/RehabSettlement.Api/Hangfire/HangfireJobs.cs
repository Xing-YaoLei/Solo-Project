using Hangfire;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Hangfire;

public static class ExceptionHandlingJob
{
    public static async Task CheckExceptionStatus()
    {
        // 这里会通过依赖注入获取服务
        // 实际使用时需要用 JobActivator
    }
}

public static class NotificationJob
{
    public static async Task SendReminders()
    {
        // 发送提醒通知
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
