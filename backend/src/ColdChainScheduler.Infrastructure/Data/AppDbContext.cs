using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ProductTag> ProductTags => Set<ProductTag>();
    public DbSet<SettlementSheet> SettlementSheets => Set<SettlementSheet>();
    public DbSet<SettlementSheetItem> SettlementSheetItems => Set<SettlementSheetItem>();
    public DbSet<GroupBatch> GroupBatches => Set<GroupBatch>();
    public DbSet<ArrivalList> ArrivalLists => Set<ArrivalList>();
    public DbSet<ArrivalListItem> ArrivalListItems => Set<ArrivalListItem>();
    public DbSet<LeaderTier> LeaderTiers => Set<LeaderTier>();
    public DbSet<StatusChangeLog> StatusChangeLogs => Set<StatusChangeLog>();
    public DbSet<ExceptionOrder> ExceptionOrders => Set<ExceptionOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified))
        {
            if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
            {
                entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
