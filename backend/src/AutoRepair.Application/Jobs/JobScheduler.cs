using Hangfire;

namespace AutoRepair.Application.Jobs;

public interface IJobScheduler
{
    Task ScheduleRecurringJobs();
}

public class JobScheduler : IJobScheduler
{
    public Task ScheduleRecurringJobs()
    {
        RecurringJob.AddOrUpdate<StockCheckJob>(
            "stock-check-job",
            job => job.ExecuteAsync(),
            Cron.Hourly(15),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

        RecurringJob.AddOrUpdate<MaintenanceReminderJob>(
            "maintenance-reminder-job",
            job => job.ExecuteAsync(),
            Cron.Daily(8, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

        RecurringJob.AddOrUpdate<DailyScheduleJob>(
            "daily-schedule-job",
            job => job.ExecuteAsync(),
            Cron.Daily(7, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

        return Task.CompletedTask;
    }
}
