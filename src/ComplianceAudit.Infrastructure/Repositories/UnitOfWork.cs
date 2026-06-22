using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    public IGenericRepository<Regulation> Regulations { get; }
    public IGenericRepository<AuditSchedule> AuditSchedules { get; }
    public IGenericRepository<ChecklistTemplate> ChecklistTemplates { get; }
    public IGenericRepository<ChecklistTemplateItem> ChecklistTemplateItems { get; }
    public IGenericRepository<ChecklistItem> ChecklistItems { get; }
    public IGenericRepository<SamplingRecord> SamplingRecords { get; }
    public IGenericRepository<CheckRecord> CheckRecords { get; }
    public IGenericRepository<Rectification> Rectifications { get; }
    public IGenericRepository<Evidence> Evidences { get; }
    public IGenericRepository<EvidenceMissingRecord> EvidenceMissingRecords { get; }
    public IGenericRepository<ProcessingHistory> ProcessingHistories { get; }
    public IGenericRepository<AuditLog> AuditLogs { get; }

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Regulations = new GenericRepository<Regulation>(context);
        AuditSchedules = new GenericRepository<AuditSchedule>(context);
        ChecklistTemplates = new GenericRepository<ChecklistTemplate>(context);
        ChecklistTemplateItems = new GenericRepository<ChecklistTemplateItem>(context);
        ChecklistItems = new GenericRepository<ChecklistItem>(context);
        SamplingRecords = new GenericRepository<SamplingRecord>(context);
        CheckRecords = new GenericRepository<CheckRecord>(context);
        Rectifications = new GenericRepository<Rectification>(context);
        Evidences = new GenericRepository<Evidence>(context);
        EvidenceMissingRecords = new GenericRepository<EvidenceMissingRecord>(context);
        ProcessingHistories = new GenericRepository<ProcessingHistory>(context);
        AuditLogs = new GenericRepository<AuditLog>(context);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}
