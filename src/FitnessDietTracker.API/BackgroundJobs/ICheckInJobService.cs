namespace FitnessDietTracker.API.BackgroundJobs;

public interface ICheckInJobService
{
    Task CheckAndNotifyInterruptionsAsync();
}
