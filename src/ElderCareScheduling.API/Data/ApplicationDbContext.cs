using ElderCareScheduling.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Elder> Elders { get; set; }
    public DbSet<CareLevel> CareLevels { get; set; }
    public DbSet<Medication> Medications { get; set; }
    public DbSet<Bed> Beds { get; set; }
    public DbSet<CareSchedule> CareSchedules { get; set; }
    public DbSet<ScheduleStatusHistory> ScheduleStatusHistories { get; set; }
    public DbSet<ExceptionRecord> ExceptionRecords { get; set; }
    public DbSet<ExceptionAttachment> ExceptionAttachments { get; set; }
    public DbSet<ExceptionStatusHistory> ExceptionStatusHistories { get; set; }
    public DbSet<ReviewRecord> ReviewRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CareSchedule>()
            .HasIndex(s => s.ScheduleNo)
            .IsUnique();

        modelBuilder.Entity<ExceptionRecord>()
            .HasIndex(e => e.ExceptionNo)
            .IsUnique();

        modelBuilder.Entity<Elder>()
            .HasIndex(e => e.IdCardNumber)
            .IsUnique()
            .HasFilter("[IdCardNumber] IS NOT NULL");

        modelBuilder.Entity<Bed>()
            .HasIndex(b => b.BedNumber)
            .IsUnique();

        modelBuilder.Entity<CareLevel>()
            .HasIndex(c => c.LevelType)
            .IsUnique();

        modelBuilder.Entity<Elder>()
            .HasOne(e => e.CareLevel)
            .WithMany(c => c.Elders)
            .HasForeignKey(e => e.CareLevelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Elder>()
            .HasMany(e => e.Medications)
            .WithOne(m => m.Elder)
            .HasForeignKey(m => m.ElderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Elder>()
            .HasMany(e => e.Schedules)
            .WithOne(s => s.Elder)
            .HasForeignKey(s => s.ElderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CareSchedule>()
            .HasOne(s => s.Bed)
            .WithMany(b => b.Schedules)
            .HasForeignKey(s => s.BedId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CareSchedule>()
            .HasOne(s => s.CareLevel)
            .WithMany(c => c.Schedules)
            .HasForeignKey(s => s.CareLevelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CareSchedule>()
            .HasMany(s => s.ReviewRecords)
            .WithOne(r => r.Schedule)
            .HasForeignKey(r => r.ScheduleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CareSchedule>()
            .HasMany(s => s.ExceptionRecords)
            .WithOne(e => e.Schedule)
            .HasForeignKey(e => e.ScheduleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CareSchedule>()
            .HasMany(s => s.StatusHistories)
            .WithOne(h => h.Schedule)
            .HasForeignKey(h => h.ScheduleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExceptionRecord>()
            .HasOne(e => e.Elder)
            .WithMany(e => e.ExceptionRecords)
            .HasForeignKey(e => e.ElderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExceptionRecord>()
            .HasMany(e => e.ReviewRecords)
            .WithOne(r => r.ExceptionRecord)
            .HasForeignKey(r => r.ExceptionRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExceptionRecord>()
            .HasMany(e => e.Attachments)
            .WithOne(a => a.ExceptionRecord)
            .HasForeignKey(a => a.ExceptionRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExceptionRecord>()
            .HasMany(e => e.StatusHistories)
            .WithOne(h => h.ExceptionRecord)
            .HasForeignKey(h => h.ExceptionRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        SeedInitialData(modelBuilder);
    }

    private static void SeedInitialData(ModelBuilder modelBuilder)
    {
        var careLevelId1 = Guid.NewGuid();
        var careLevelId2 = Guid.NewGuid();
        var careLevelId3 = Guid.NewGuid();
        var careLevelId4 = Guid.NewGuid();
        var careLevelId5 = Guid.NewGuid();

        modelBuilder.Entity<CareLevel>().HasData(
            new CareLevel
            {
                Id = careLevelId1,
                LevelType = Enums.CareLevelType.Independent,
                LevelName = "自理级",
                Description = "生活完全自理，无需他人协助",
                CareItems = "日常健康监测、定期体检、文娱活动",
                ServiceStandards = "每日健康巡查1次，每周健康评估1次",
                DailyCareHours = 1,
                NurseRatio = 15,
                MonthlyFee = 3000,
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            },
            new CareLevel
            {
                Id = careLevelId2,
                LevelType = Enums.CareLevelType.SemiAssisted,
                LevelName = "半护理级",
                Description = "部分生活需要协助，行动不便",
                CareItems = "协助洗漱、协助进食、协助如厕、日常护理",
                ServiceStandards = "每日巡查3次，协助完成日常起居",
                DailyCareHours = 4,
                NurseRatio = 8,
                MonthlyFee = 5000,
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            },
            new CareLevel
            {
                Id = careLevelId3,
                LevelType = Enums.CareLevelType.FullAssisted,
                LevelName = "全护理级",
                Description = "生活完全不能自理，需要全面护理",
                CareItems = "24小时监护、全生活护理、康复护理",
                ServiceStandards = "全天候护理，每2小时巡查1次",
                DailyCareHours = 12,
                NurseRatio = 4,
                MonthlyFee = 8000,
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            },
            new CareLevel
            {
                Id = careLevelId4,
                LevelType = Enums.CareLevelType.Intensive,
                LevelName = "特护理级",
                Description = "病情需要密切观察或重症康复期",
                CareItems = "24小时专人护理、医疗监护、专业康复",
                ServiceStandards = "专人专护，实时监护",
                DailyCareHours = 24,
                NurseRatio = 2,
                MonthlyFee = 12000,
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            },
            new CareLevel
            {
                Id = careLevelId5,
                LevelType = Enums.CareLevelType.Special,
                LevelName = "专护级",
                Description = "特殊需求护理，如痴呆、临终关怀等",
                CareItems = "个性化护理方案、专业照护、心理疏导",
                ServiceStandards = "定制化护理方案",
                DailyCareHours = 24,
                NurseRatio = 1,
                MonthlyFee = 15000,
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            }
        );

        var beds = new List<Bed>();
        for (int floor = 1; floor <= 3; floor++)
        {
            for (int room = 1; room <= 10; room++)
            {
                for (int bed = 1; bed <= 2; bed++)
                {
                    beds.Add(new Bed
                    {
                        Id = Guid.NewGuid(),
                        BedNumber = $"{floor}F-{room:D2}-{bed}",
                        RoomNumber = $"{floor}F{room:D2}",
                        Floor = $"{floor}F",
                        Building = "A栋",
                        Description = $"标准间床位，配备护理床、呼叫系统",
                        Status = Enums.BedStatus.Available,
                        EquipmentInfo = "电动护理床、呼叫器、氧气接口、负压吸引接口",
                        CreatedAt = new DateTime(2024, 1, 1),
                        IsActive = true
                    });
                }
            }
        }
        modelBuilder.Entity<Bed>().HasData(beds);
    }
}
