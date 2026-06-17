
using Microsoft.EntityFrameworkCore;
using MoveOutInspection.Core.Entities;

namespace MoveOutInspection.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<MoveOutOrder> MoveOutOrders { get; set; }
    public DbSet<Apartment> Apartments { get; set; }
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<UtilityReading> UtilityReadings { get; set; }
    public DbSet<InspectionTemplate> InspectionTemplates { get; set; }
    public DbSet<InspectionItem> InspectionItems { get; set; }
    public DbSet<InspectionRecord> InspectionRecords { get; set; }
    public DbSet<PaymentRecord> PaymentRecords { get; set; }
    public DbSet<ComplaintTag> ComplaintTags { get; set; }
    public DbSet<TimelineEvent> TimelineEvents { get; set; }
    public DbSet<TodoTask> TodoTasks { get; set; }
    public DbSet<RentOverdueRecord> RentOverdueRecords { get; set; }
    public DbSet<AffectedParty> AffectedParties { get; set; }
    public DbSet<ResponsibilityAdjustment> ResponsibilityAdjustments { get; set; }
    public DbSet<SourceRecord> SourceRecords { get; set; }
    public DbSet<RepairRecord> RepairRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType.IsSubclassOf(typeof(EntityBase)))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(EF.Property<bool>(entityType.ClrType, "IsDeleted") == false);
            }
        }

        modelBuilder.Entity<MoveOutOrder>()
            .HasIndex(o => o.OrderNumber)
            .IsUnique();

        modelBuilder.Entity<MoveOutOrder>()
            .HasOne(o => o.Apartment)
            .WithMany(a => a.MoveOutOrders)
            .HasForeignKey(o => o.ApartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MoveOutOrder>()
            .HasOne(o => o.Tenant)
            .WithMany(t => t.MoveOutOrders)
            .HasForeignKey(o => o.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MoveOutOrder>()
            .HasOne(o => o.AssignedHandler)
            .WithMany(s => s.AssignedOrders)
            .HasForeignKey(o => o.AssignedHandlerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TimelineEvent>()
            .HasOne(e => e.Actor)
            .WithMany(s => s.TimelineEvents)
            .HasForeignKey(e => e.ActorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TodoTask>()
            .HasOne(t => t.AssignedTo)
            .WithMany(s => s.AssignedTodos)
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TodoTask>()
            .HasOne(t => t.CreatedByStaff)
            .WithMany(s => s.CreatedTodos)
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Staff>()
            .HasIndex(s => s.EmployeeId)
            .IsUnique();

        modelBuilder.Entity<PaymentRecord>()
            .HasIndex(p => p.TransactionNo)
            .IsUnique();

        modelBuilder.Entity<TodoTask>()
            .HasIndex(t => t.TaskNo)
            .IsUnique();

        modelBuilder.Entity<InspectionRecord>()
            .Property(e => e.PhotoUrls)
            .HasConversion(
                v => v != null ? string.Join(',', v) : null,
                v => v != null ? v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() : null);

        modelBuilder.Entity<TimelineEvent>()
            .Property(e => e.AttachmentUrls)
            .HasConversion(
                v => v != null ? string.Join(',', v) : null,
                v => v != null ? v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() : null);

        modelBuilder.Entity<TodoTask>()
            .Property(e => e.AttachmentUrls)
            .HasConversion(
                v => v != null ? string.Join(',', v) : null,
                v => v != null ? v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() : null);

        modelBuilder.Entity<RepairRecord>()
            .Property(e => e.PhotoUrls)
            .HasConversion(
                v => v != null ? string.Join(',', v) : null,
                v => v != null ? v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() : null);

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var staffId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var staffId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var staffId3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var staffId4 = Guid.Parse("44444444-4444-4444-4444-444444444444");

        modelBuilder.Entity<Staff>().HasData(
            new Staff
            {
                Id = staffId1,
                Name = "张伟",
                EmployeeId = "INS001",
                Phone = "13800138001",
                Email = "zhangwei@example.com",
                Role = Core.Enums.RoleType.Inspector,
                Department = "验房部",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new Staff
            {
                Id = staffId2,
                Name = "李娜",
                EmployeeId = "PM001",
                Phone = "13800138002",
                Email = "lina@example.com",
                Role = Core.Enums.RoleType.PropertyManager,
                Department = "物业部",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new Staff
            {
                Id = staffId3,
                Name = "王强",
                EmployeeId = "FIN001",
                Phone = "13800138003",
                Email = "wangqiang@example.com",
                Role = Core.Enums.RoleType.FinancialStaff,
                Department = "财务部",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new Staff
            {
                Id = staffId4,
                Name = "赵敏",
                EmployeeId = "CS001",
                Phone = "13800138004",
                Email = "zhaomin@example.com",
                Role = Core.Enums.RoleType.CustomerService,
                Department = "客服部",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            }
        );

        var apartmentId1 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var apartmentId2 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        modelBuilder.Entity<Apartment>().HasData(
            new Apartment
            {
                Id = apartmentId1,
                ApartmentNumber = "1201",
                Building = "A栋",
                Floor = "12楼",
                Address = "阳光花园A栋1201室",
                Area = 85.5m,
                Bedrooms = 2,
                Bathrooms = 1,
                LandlordName = "陈先生",
                LandlordPhone = "13900139001",
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new Apartment
            {
                Id = apartmentId2,
                ApartmentNumber = "1503",
                Building = "B栋",
                Floor = "15楼",
                Address = "阳光花园B栋1503室",
                Area = 110.0m,
                Bedrooms = 3,
                Bathrooms = 2,
                LandlordName = "刘女士",
                LandlordPhone = "13900139002",
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            }
        );

        var tenantId1 = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var tenantId2 = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        modelBuilder.Entity<Tenant>().HasData(
            new Tenant
            {
                Id = tenantId1,
                Name = "孙小明",
                Phone = "13700137001",
                IdCardNumber = "110101199001011234",
                Email = "sunxiaoming@example.com",
                EmergencyContact = "孙母",
                EmergencyPhone = "13700137002",
                LeaseStartDate = new DateTime(2023, 6, 1),
                LeaseEndDate = new DateTime(2024, 5, 31),
                MonthlyRent = 4500m,
                Deposit = 9000m,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new Tenant
            {
                Id = tenantId2,
                Name = "周小红",
                Phone = "13700137003",
                IdCardNumber = "110101199202022345",
                Email = "zhouxiaohong@example.com",
                EmergencyContact = "周父",
                EmergencyPhone = "13700137004",
                LeaseStartDate = new DateTime(2023, 8, 15),
                LeaseEndDate = new DateTime(2024, 8, 14),
                MonthlyRent = 6500m,
                Deposit = 13000m,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            }
        );

        var orderId1 = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        var orderId2 = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        modelBuilder.Entity<MoveOutOrder>().HasData(
            new MoveOutOrder
            {
                Id = orderId1,
                OrderNumber = "MO202406001",
                ApartmentId = apartmentId1,
                TenantId = tenantId1,
                MoveOutDate = new DateTime(2024, 6, 5),
                ActualMoveOutDate = new DateTime(2024, 6, 5),
                InspectionDate = new DateTime(2024, 6, 6),
                Status = Core.Enums.MoveOutStatus.Inspecting,
                AssignedHandlerId = staffId1,
                CoHandlerId = staffId2,
                Reason = "租约到期",
                CreatedAt = new DateTime(2024, 6, 1, 9, 0, 0),
                CreatedBy = "system"
            },
            new MoveOutOrder
            {
                Id = orderId2,
                OrderNumber = "MO202406002",
                ApartmentId = apartmentId2,
                TenantId = tenantId2,
                MoveOutDate = new DateTime(2024, 6, 20),
                Status = Core.Enums.MoveOutStatus.Scheduled,
                AssignedHandlerId = staffId1,
                Reason = "提前退租",
                CreatedAt = new DateTime(2024, 6, 10, 14, 30, 0),
                CreatedBy = "system"
            }
        );

        var templateId1 = Guid.Parse("aaaaaaaa-5555-5555-5555-555555555555");

        modelBuilder.Entity<InspectionTemplate>().HasData(
            new InspectionTemplate
            {
                Id = templateId1,
                Name = "标准退租验房清单",
                Category = "通用",
                Description = "适用于所有公寓的标准验房模板",
                SortOrder = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            }
        );

        var itemId1 = Guid.Parse("11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var itemId2 = Guid.Parse("22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var itemId3 = Guid.Parse("33333333-cccc-cccc-cccc-cccccccccccc");
        var itemId4 = Guid.Parse("44444444-dddd-dddd-dddd-dddddddddddd");
        var itemId5 = Guid.Parse("55555555-eeee-eeee-eeee-eeeeeeeeeeee");
        var itemId6 = Guid.Parse("66666666-ffff-ffff-ffff-ffffffffffff");

        modelBuilder.Entity<InspectionItem>().HasData(
            new InspectionItem
            {
                Id = itemId1,
                InspectionTemplateId = templateId1,
                Name = "墙面",
                Category = "装修",
                Description = "检查墙面是否有污渍、破损、涂鸦",
                SortOrder = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new InspectionItem
            {
                Id = itemId2,
                InspectionTemplateId = templateId1,
                Name = "地板",
                Category = "装修",
                Description = "检查地板是否有划痕、破损、起翘",
                SortOrder = 2,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new InspectionItem
            {
                Id = itemId3,
                InspectionTemplateId = templateId1,
                Name = "门窗",
                Category = "设施",
                Description = "检查门窗是否完好，开关正常",
                SortOrder = 3,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new InspectionItem
            {
                Id = itemId4,
                InspectionTemplateId = templateId1,
                Name = "厨房设备",
                Category = "家电",
                Description = "检查油烟机、灶具、冰箱等是否正常",
                SortOrder = 4,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new InspectionItem
            {
                Id = itemId5,
                InspectionTemplateId = templateId1,
                Name = "卫浴设备",
                Category = "设施",
                Description = "检查马桶、淋浴、洗手台是否正常",
                SortOrder = 5,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            },
            new InspectionItem
            {
                Id = itemId6,
                InspectionTemplateId = templateId1,
                Name = "水电设施",
                Category = "设施",
                Description = "检查灯具、开关、插座、水管是否正常",
                SortOrder = 6,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1),
                CreatedBy = "system"
            }
        );

        var todoId1 = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var todoId2 = Guid.Parse("77777777-7777-7777-7777-777777777777");
        var todoId3 = Guid.Parse("88888888-8888-8888-8888-888888888888");

        modelBuilder.Entity<TodoTask>().HasData(
            new TodoTask
            {
                Id = todoId1,
                TaskNo = "TODO202406001",
                MoveOutOrderId = orderId1,
                Title = "完成水电抄表",
                Description = "请前往1201室抄录水电表读数",
                Status = Core.Enums.TodoStatus.InProgress,
                Priority = Core.Enums.TodoPriority.High,
                Category = "水电读数",
                AssignedToId = staffId1,
                CreatedById = staffId2,
                DueDate = new DateTime(2024, 6, 7, 18, 0, 0),
                StartedAt = new DateTime(2024, 6, 6, 9, 0, 0),
                CreatedAt = new DateTime(2024, 6, 1, 10, 0, 0),
                CreatedBy = "system"
            },
            new TodoTask
            {
                Id = todoId2,
                TaskNo = "TODO202406002",
                MoveOutOrderId = orderId1,
                Title = "验房并记录损坏情况",
                Description = "按照标准清单完成验房，记录所有损坏项目",
                Status = Core.Enums.TodoStatus.Pending,
                Priority = Core.Enums.TodoPriority.High,
                Category = "验房",
                AssignedToId = staffId1,
                CreatedById = staffId2,
                DueDate = new DateTime(2024, 6, 8, 18, 0, 0),
                CreatedAt = new DateTime(2024, 6, 1, 10, 5, 0),
                CreatedBy = "system"
            },
            new TodoTask
            {
                Id = todoId3,
                TaskNo = "TODO202406003",
                MoveOutOrderId = orderId2,
                Title = "联系租客确认退租日期",
                Description = "与周小红确认最终退租时间及安排",
                Status = Core.Enums.TodoStatus.Pending,
                Priority = Core.Enums.TodoPriority.Medium,
                Category = "沟通协调",
                AssignedToId = staffId4,
                CreatedById = staffId2,
                DueDate = new DateTime(2024, 6, 15, 18, 0, 0),
                CreatedAt = new DateTime(2024, 6, 10, 15, 0, 0),
                CreatedBy = "system"
            }
        );
    }
}
