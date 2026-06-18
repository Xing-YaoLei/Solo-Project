using Microsoft.EntityFrameworkCore;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Vehicle> Vehicles { get; }
    DbSet<WorkOrder> WorkOrders { get; }
    DbSet<WorkOrderItem> WorkOrderItems { get; }
    DbSet<Diagnosis> Diagnoses { get; }
    DbSet<Part> Parts { get; }
    DbSet<PartInventory> PartInventories { get; }
    DbSet<StockAlert> StockAlerts { get; }
    DbSet<Quote> Quotes { get; }
    DbSet<QuoteItem> QuoteItems { get; }
    DbSet<CommunicationLog> CommunicationLogs { get; }
    DbSet<ReviewOpinion> ReviewOpinions { get; }
    DbSet<MaintenanceReminder> MaintenanceReminders { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
