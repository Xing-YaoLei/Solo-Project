
using MoveOutInspection.Core.Entities;

namespace MoveOutInspection.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<MoveOutOrder> MoveOutOrders { get; }
    IRepository<Apartment> Apartments { get; }
    IRepository<Tenant> Tenants { get; }
    IRepository<Staff> Staffs { get; }
    IRepository<UtilityReading> UtilityReadings { get; }
    IRepository<InspectionTemplate> InspectionTemplates { get; }
    IRepository<InspectionItem> InspectionItems { get; }
    IRepository<InspectionRecord> InspectionRecords { get; }
    IRepository<PaymentRecord> PaymentRecords { get; }
    IRepository<ComplaintTag> ComplaintTags { get; }
    IRepository<TimelineEvent> TimelineEvents { get; }
    IRepository<TodoTask> TodoTasks { get; }
    IRepository<RentOverdueRecord> RentOverdueRecords { get; }
    IRepository<AffectedParty> AffectedParties { get; }
    IRepository<ResponsibilityAdjustment> ResponsibilityAdjustments { get; }
    IRepository<SourceRecord> SourceRecords { get; }
    IRepository<RepairRecord> RepairRecords { get; }

    Task<int> SaveChangesAsync();
}
