namespace ElderCareScheduling.API.Repositories;

public interface IUnitOfWork : IDisposable
{
    IElderRepository Elders { get; }
    IBedRepository Beds { get; }
    ICareLevelRepository CareLevels { get; }
    IMedicationRepository Medications { get; }
    IScheduleRepository Schedules { get; }
    IExceptionRecordRepository ExceptionRecords { get; }
    IReviewRecordRepository ReviewRecords { get; }
    Task<int> CompleteAsync();
}
