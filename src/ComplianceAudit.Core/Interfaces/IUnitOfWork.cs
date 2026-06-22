using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IUnitOfWork
{
    IGenericRepository<Regulation> Regulations { get; }
    IGenericRepository<AuditSchedule> AuditSchedules { get; }
    IGenericRepository<ChecklistTemplate> ChecklistTemplates { get; }
    IGenericRepository<ChecklistTemplateItem> ChecklistTemplateItems { get; }
    IGenericRepository<ChecklistItem> ChecklistItems { get; }
    IGenericRepository<SamplingRecord> SamplingRecords { get; }
    IGenericRepository<CheckRecord> CheckRecords { get; }
    IGenericRepository<Rectification> Rectifications { get; }
    IGenericRepository<Evidence> Evidences { get; }
    IGenericRepository<EvidenceMissingRecord> EvidenceMissingRecords { get; }
    IGenericRepository<ProcessingHistory> ProcessingHistories { get; }
    IGenericRepository<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
