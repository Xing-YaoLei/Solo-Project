using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;

namespace TicketDesk.Infrastructure.Data;

public class TicketDeskDbContext : DbContext
{
    public TicketDeskDbContext(DbContextOptions<TicketDeskDbContext> options) : base(options) { }

    public DbSet<Event> Events => Set<Event>();
    public DbSet<SeatMap> SeatMaps => Set<SeatMap>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<TicketType> TicketTypes => Set<TicketType>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<AllocationDocument> AllocationDocuments => Set<AllocationDocument>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<AllocationDocument>(e =>
        {
            e.HasIndex(d => d.DocumentNumber).IsUnique();
            e.HasMany(d => d.Orders).WithOne().HasForeignKey("AllocationDocumentId").OnDelete(DeleteBehavior.Restrict);
            e.HasMany(d => d.Disputes).WithOne().HasForeignKey("AllocationDocumentId").OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<Order>(e =>
        {
            e.HasIndex(o => o.OrderNumber).IsUnique();
        });

        model.Entity<Seat>(e =>
        {
            e.HasOne(s => s.TicketType).WithMany(t => t.Seats).HasForeignKey(s => s.TicketTypeId).OnDelete(DeleteBehavior.SetNull);
        });

        model.Entity<Dispute>(e =>
        {
            e.HasOne(d => d.Order).WithMany(o => o.Disputes).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.Property(d => d.EvidenceJson).HasColumnType("nvarchar(max)");
        });

        model.Entity<SeatMap>(e =>
        {
            e.Property(s => s.LayoutJson).HasColumnType("nvarchar(max)");
        });

        model.Entity<TicketType>(e =>
        {
            e.Property(t => t.RulesJson).HasColumnType("nvarchar(max)");
        });

        var enumProperties = model.Model.GetEntityTypes()
            .SelectMany(et => et.GetProperties()
                .Where(p => p.ClrType.IsEnum || (Nullable.GetUnderlyingType(p.ClrType)?.IsEnum ?? false))
                .Select(p => new { EntityType = et, Property = p }))
            .ToList();

        foreach (var ep in enumProperties)
        {
            model.Entity(ep.EntityType.ClrType).Property(ep.Property.Name).HasConversion<string>();
        }
    }
}
