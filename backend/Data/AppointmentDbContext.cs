using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Data;

public class AppointmentDbContext : DbContext
{
    public AppointmentDbContext(DbContextOptions<AppointmentDbContext> options)
        : base(options)
    {
    }

    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Quote> Quotes { get; set; }
    public DbSet<QuoteItem> QuoteItems { get; set; }
    public DbSet<InspectionPhoto> InspectionPhotos { get; set; }
    public DbSet<Parts> Parts { get; set; }
    public DbSet<PartsShortageRecord> PartsShortageRecords { get; set; }
    public DbSet<ServiceRecord> ServiceRecords { get; set; }
    public DbSet<RepairReturn> RepairReturns { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(e => e.PlateNumber).IsUnique();
            entity.HasIndex(e => e.VinNumber).IsUnique();
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasIndex(e => e.AppointmentNo).IsUnique();
            entity.HasOne(e => e.Vehicle)
                  .WithMany(e => e.Appointments)
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Quote>(entity =>
        {
            entity.HasOne(e => e.Appointment)
                  .WithMany(e => e.Quotes)
                  .HasForeignKey(e => e.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuoteItem>(entity =>
        {
            entity.HasOne(e => e.Quote)
                  .WithMany(e => e.QuoteItems)
                  .HasForeignKey(e => e.QuoteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InspectionPhoto>(entity =>
        {
            entity.HasOne(e => e.Appointment)
                  .WithMany(e => e.InspectionPhotos)
                  .HasForeignKey(e => e.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Parts>(entity =>
        {
            entity.HasIndex(e => e.PartNumber).IsUnique();
        });

        modelBuilder.Entity<PartsShortageRecord>(entity =>
        {
            entity.HasOne(e => e.Appointment)
                  .WithMany(e => e.PartsShortageRecords)
                  .HasForeignKey(e => e.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Parts)
                  .WithMany(e => e.PartsShortageRecords)
                  .HasForeignKey(e => e.PartsId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ServiceRecord>(entity =>
        {
            entity.HasOne(e => e.Appointment)
                  .WithMany(e => e.ServiceRecords)
                  .HasForeignKey(e => e.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RepairReturn>(entity =>
        {
            entity.HasOne(e => e.OriginalAppointment)
                  .WithMany(e => e.OriginalRepairReturns)
                  .HasForeignKey(e => e.OriginalAppointmentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.NewAppointment)
                  .WithMany(e => e.NewRepairReturns)
                  .HasForeignKey(e => e.NewAppointmentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Vehicle>().HasData(
            new Vehicle
            {
                Id = 1,
                PlateNumber = "京A12345",
                VinNumber = "LFV3A23C8D3000001",
                Brand = "大众",
                Model = "迈腾",
                OwnerName = "张三",
                OwnerPhone = "13800138001",
                Mileage = 50000,
                LastMaintenanceDate = new DateTime(2025, 12, 1),
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 1, 1)
            },
            new Vehicle
            {
                Id = 2,
                PlateNumber = "京B67890",
                VinNumber = "LFV3A23C8D3000002",
                Brand = "丰田",
                Model = "凯美瑞",
                OwnerName = "李四",
                OwnerPhone = "13800138002",
                Mileage = 32000,
                LastMaintenanceDate = new DateTime(2026, 1, 15),
                CreatedAt = new DateTime(2026, 1, 10),
                UpdatedAt = new DateTime(2026, 1, 10)
            },
            new Vehicle
            {
                Id = 3,
                PlateNumber = "京C11111",
                VinNumber = "LFV3A23C8D3000003",
                Brand = "本田",
                Model = "雅阁",
                OwnerName = "王五",
                OwnerPhone = "13800138003",
                Mileage = 78000,
                LastMaintenanceDate = new DateTime(2025, 11, 20),
                CreatedAt = new DateTime(2026, 2, 1),
                UpdatedAt = new DateTime(2026, 2, 1)
            }
        );

        modelBuilder.Entity<Appointment>().HasData(
            new Appointment
            {
                Id = 1,
                AppointmentNo = "AP202606010001",
                VehicleId = 1,
                AppointmentTime = new DateTime(2026, 6, 20, 9, 0, 0),
                CheckInTime = null,
                CompletionTime = null,
                CloseTime = null,
                Source = AppointmentSource.Online,
                PersonInCharge = "张师傅",
                Status = AppointmentStatus.Pending,
                Remarks = "常规保养",
                CreatedAt = new DateTime(2026, 6, 18),
                UpdatedAt = new DateTime(2026, 6, 18)
            },
            new Appointment
            {
                Id = 2,
                AppointmentNo = "AP202606150002",
                VehicleId = 2,
                AppointmentTime = new DateTime(2026, 6, 15, 10, 0, 0),
                CheckInTime = new DateTime(2026, 6, 15, 9, 45, 0),
                CompletionTime = null,
                CloseTime = null,
                Source = AppointmentSource.Phone,
                PersonInCharge = "李师傅",
                Status = AppointmentStatus.InService,
                Remarks = "发动机异响检查",
                CreatedAt = new DateTime(2026, 6, 14),
                UpdatedAt = new DateTime(2026, 6, 15)
            },
            new Appointment
            {
                Id = 3,
                AppointmentNo = "AP202606100003",
                VehicleId = 3,
                AppointmentTime = new DateTime(2026, 6, 10, 14, 0, 0),
                CheckInTime = new DateTime(2026, 6, 10, 13, 50, 0),
                CompletionTime = new DateTime(2026, 6, 12, 16, 0, 0),
                CloseTime = new DateTime(2026, 6, 12, 17, 0, 0),
                Source = AppointmentSource.WalkIn,
                PersonInCharge = "王师傅",
                Status = AppointmentStatus.Closed,
                Remarks = "刹车系统维修",
                CreatedAt = new DateTime(2026, 6, 10),
                UpdatedAt = new DateTime(2026, 6, 12)
            }
        );

        modelBuilder.Entity<Parts>().HasData(
            new Parts
            {
                Id = 1,
                PartNumber = "P001",
                Name = "机油滤清器",
                Specification = "通用型",
                StockQuantity = 100,
                SafetyStock = 20,
                UnitPrice = 35.00m,
                Supplier = "供应商A",
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 1, 1)
            },
            new Parts
            {
                Id = 2,
                PartNumber = "P002",
                Name = "空气滤清器",
                Specification = "通用型",
                StockQuantity = 15,
                SafetyStock = 30,
                UnitPrice = 45.00m,
                Supplier = "供应商A",
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 1, 1)
            },
            new Parts
            {
                Id = 3,
                PartNumber = "P003",
                Name = "刹车片",
                Specification = "前刹",
                StockQuantity = 5,
                SafetyStock = 10,
                UnitPrice = 280.00m,
                Supplier = "供应商B",
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 1, 1)
            },
            new Parts
            {
                Id = 4,
                PartNumber = "P004",
                Name = "全合成机油",
                Specification = "5W-40 4L",
                StockQuantity = 50,
                SafetyStock = 15,
                UnitPrice = 268.00m,
                Supplier = "供应商C",
                CreatedAt = new DateTime(2026, 1, 1),
                UpdatedAt = new DateTime(2026, 1, 1)
            }
        );
    }
}
