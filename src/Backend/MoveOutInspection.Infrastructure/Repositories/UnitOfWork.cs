
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Data;

namespace MoveOutInspection.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        MoveOutOrders = new Repository<MoveOutOrder>(context);
        Apartments = new Repository<Apartment>(context);
        Tenants = new Repository<Tenant>(context);
        Staffs = new Repository<Staff>(context);
        UtilityReadings = new Repository<UtilityReading>(context);
        InspectionTemplates = new Repository<InspectionTemplate>(context);
        InspectionItems = new Repository<InspectionItem>(context);
        InspectionRecords = new Repository<InspectionRecord>(context);
        PaymentRecords = new Repository<PaymentRecord>(context);
        ComplaintTags = new Repository<ComplaintTag>(context);
        TimelineEvents = new Repository<TimelineEvent>(context);
        TodoTasks = new Repository<TodoTask>(context);
        RentOverdueRecords = new Repository<RentOverdueRecord>(context);
        AffectedParties = new Repository<AffectedParty>(context);
        ResponsibilityAdjustments = new Repository<ResponsibilityAdjustment>(context);
        SourceRecords = new Repository<SourceRecord>(context);
        RepairRecords = new Repository<RepairRecord>(context);
    }

    public IRepository<MoveOutOrder> MoveOutOrders { get; private set; }
    public IRepository<Apartment> Apartments { get; private set; }
    public IRepository<Tenant> Tenants { get; private set; }
    public IRepository<Staff> Staffs { get; private set; }
    public IRepository<UtilityReading> UtilityReadings { get; private set; }
    public IRepository<InspectionTemplate> InspectionTemplates { get; private set; }
    public IRepository<InspectionItem> InspectionItems { get; private set; }
    public IRepository<InspectionRecord> InspectionRecords { get; private set; }
    public IRepository<PaymentRecord> PaymentRecords { get; private set; }
    public IRepository<ComplaintTag> ComplaintTags { get; private set; }
    public IRepository<TimelineEvent> TimelineEvents { get; private set; }
    public IRepository<TodoTask> TodoTasks { get; private set; }
    public IRepository<RentOverdueRecord> RentOverdueRecords { get; private set; }
    public IRepository<AffectedParty> AffectedParties { get; private set; }
    public IRepository<ResponsibilityAdjustment> ResponsibilityAdjustments { get; private set; }
    public IRepository<SourceRecord> SourceRecords { get; private set; }
    public IRepository<RepairRecord> RepairRecords { get; private set; }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
