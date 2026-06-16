namespace ElderCareScheduling.API.Hangfire;

public interface IHangfireJobService
{
    void RegisterRecurringJobs();
    Task ScheduleStatusCheckAsync();
    Task ExceptionReminderCheckAsync();
    Task DailyStatisticsSummaryAsync();
}
