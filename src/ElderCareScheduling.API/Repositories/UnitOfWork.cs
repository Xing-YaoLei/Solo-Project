using ElderCareScheduling.API.Data;

namespace ElderCareScheduling.API.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Elders = new ElderRepository(_context);
        Beds = new BedRepository(_context);
        CareLevels = new CareLevelRepository(_context);
        Medications = new MedicationRepository(_context);
        Schedules = new ScheduleRepository(_context);
        ExceptionRecords = new ExceptionRecordRepository(_context);
        ReviewRecords = new ReviewRecordRepository(_context);
    }

    public IElderRepository Elders { get; private set; }
    public IBedRepository Beds { get; private set; }
    public ICareLevelRepository CareLevels { get; private set; }
    public IMedicationRepository Medications { get; private set; }
    public IScheduleRepository Schedules { get; private set; }
    public IExceptionRecordRepository ExceptionRecords { get; private set; }
    public IReviewRecordRepository ReviewRecords { get; private set; }

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
