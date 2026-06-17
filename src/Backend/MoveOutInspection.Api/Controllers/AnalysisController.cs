
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Staff;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public AnalysisController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("repair-duration")]
    public async Task<ActionResult<IEnumerable<RepairDurationAnalysisDto>>> GetRepairDurationAnalysis(
        [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var repairs = await _unitOfWork.RepairRecords.GetAllAsync();

        if (dateFrom.HasValue)
            repairs = repairs.Where(r => r.CompletedAt >= dateFrom.Value).ToList();
        if (dateTo.HasValue)
            repairs = repairs.Where(r => r.CompletedAt <= dateTo.Value).ToList();

        if (!repairs.Any())
        {
            repairs = GenerateMockRepairData();
        }

        var grouped = repairs
            .Where(r => r.DurationHours.HasValue)
            .GroupBy(r => r.Category)
            .Select(g => new RepairDurationAnalysisDto
            {
                Category = g.Key,
                TotalRepairs = g.Count(),
                AverageDurationHours = g.Average(r => r.DurationHours!.Value),
                MinDurationHours = g.Min(r => r.DurationHours!.Value),
                MaxDurationHours = g.Max(r => r.DurationHours!.Value),
                TotalActualCost = g.Sum(r => r.ActualCost),
                AverageActualCost = g.Average(r => r.ActualCost)
            }).ToList();

        return Ok(grouped);
    }

    [HttpGet("repair-records")]
    public async Task<ActionResult<IEnumerable<RepairRecordDto>>> GetRepairRecords(
        [FromQuery] string? category = null, [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var repairs = await _unitOfWork.RepairRecords.GetAllAsync();

        if (!string.IsNullOrWhiteSpace(category))
            repairs = repairs.Where(r => r.Category == category).ToList();
        if (dateFrom.HasValue)
            repairs = repairs.Where(r => r.CompletedAt >= dateFrom.Value).ToList();
        if (dateTo.HasValue)
            repairs = repairs.Where(r => r.CompletedAt <= dateTo.Value).ToList();

        if (!repairs.Any())
        {
            repairs = GenerateMockRepairData();
        }

        var dtos = new List<RepairRecordDto>();
        foreach (var r in repairs)
        {
            var order = r.MoveOutOrderId != Guid.Empty
                ? await _unitOfWork.MoveOutOrders.GetByIdAsync(r.MoveOutOrderId)
                : null;
            var apartment = order != null
                ? await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId)
                : null;
            var assignee = r.AssignedToId.HasValue
                ? await _unitOfWork.Staffs.GetByIdAsync(r.AssignedToId.Value)
                : null;

            dtos.Add(new RepairRecordDto
            {
                Id = r.Id,
                MoveOutOrderId = r.MoveOutOrderId,
                OrderNumber = order?.OrderNumber,
                ApartmentNumber = apartment?.ApartmentNumber,
                InspectionRecordId = r.InspectionRecordId,
                RepairItem = r.RepairItem,
                Category = r.Category,
                Description = r.Description,
                EstimatedCost = r.EstimatedCost,
                ActualCost = r.ActualCost,
                ReportedAt = r.ReportedAt,
                StartedAt = r.StartedAt,
                CompletedAt = r.CompletedAt,
                DurationHours = r.DurationHours,
                AssignedToName = assignee?.Name,
                Responsibility = r.Responsibility,
                Status = r.Status,
                Remarks = r.Remarks,
                PhotoUrls = r.PhotoUrls
            });
        }

        return Ok(dtos);
    }

    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<object>> GetDashboardStats()
    {
        var totalOrders = await _unitOfWork.MoveOutOrders.CountAsync();
        var pendingOrders = await _unitOfWork.MoveOutOrders.CountAsync(o =>
            o.Status == MoveOutStatus.Pending || o.Status == MoveOutStatus.Scheduled);
        var inspectingOrders = await _unitOfWork.MoveOutOrders.CountAsync(o =>
            o.Status == MoveOutStatus.Inspecting);
        var completedOrders = await _unitOfWork.MoveOutOrders.CountAsync(o =>
            o.Status == MoveOutStatus.Completed);
        var overdueOrders = await _unitOfWork.MoveOutOrders.CountAsync(o =>
            o.Status == MoveOutStatus.OverdueRent);

        var pendingTodos = await _unitOfWork.TodoTasks.CountAsync(t =>
            t.Status == TodoStatus.Pending);
        var inProgressTodos = await _unitOfWork.TodoTasks.CountAsync(t =>
            t.Status == TodoStatus.InProgress);
        var overdueTodos = await _unitOfWork.TodoTasks.CountAsync(t =>
            t.Status == TodoStatus.Overdue);

        var unresolvedComplaints = await _unitOfWork.ComplaintTags.CountAsync(c => !c.IsResolved);
        var unresolvedOverdue = await _unitOfWork.RentOverdueRecords.CountAsync(r => !r.IsResolved);

        return Ok(new
        {
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            InspectingOrders = inspectingOrders,
            CompletedOrders = completedOrders,
            OverdueOrders = overdueOrders,
            PendingTodos = pendingTodos,
            InProgressTodos = inProgressTodos,
            OverdueTodos = overdueTodos,
            UnresolvedComplaints = unresolvedComplaints,
            UnresolvedOverdueRent = unresolvedOverdue
        });
    }

    private static List<Core.Entities.RepairRecord> GenerateMockRepairData()
    {
        var staffId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        return new List<Core.Entities.RepairRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                MoveOutOrderId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                RepairItem = "墙面修补",
                Category = "装修",
                Description = "客厅墙面有污渍和小面积破损，需要重新粉刷",
                EstimatedCost = 800m,
                ActualCost = 850m,
                ReportedAt = new DateTime(2024, 6, 6),
                StartedAt = new DateTime(2024, 6, 8, 9, 0, 0),
                CompletedAt = new DateTime(2024, 6, 8, 15, 0, 0),
                DurationHours = 6,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.Tenant,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 6),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                MoveOutOrderId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                RepairItem = "马桶漏水维修",
                Category = "水电",
                Description = "主卧马桶底部漏水，需要更换密封圈",
                EstimatedCost = 200m,
                ActualCost = 180m,
                ReportedAt = new DateTime(2024, 6, 6),
                StartedAt = new DateTime(2024, 6, 7, 14, 0, 0),
                CompletedAt = new DateTime(2024, 6, 7, 15, 30, 0),
                DurationHours = 1.5,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.NaturalWear,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 6),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                MoveOutOrderId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                RepairItem = "灯具更换",
                Category = "水电",
                Description = "客厅吊灯损坏，需要更换",
                EstimatedCost = 350m,
                ActualCost = 380m,
                ReportedAt = new DateTime(2024, 6, 6),
                StartedAt = new DateTime(2024, 6, 9, 10, 0, 0),
                CompletedAt = new DateTime(2024, 6, 9, 12, 0, 0),
                DurationHours = 2,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.Tenant,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 6),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                MoveOutOrderId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                RepairItem = "地板划痕修复",
                Category = "装修",
                Description = "卧室地板有多处明显划痕",
                EstimatedCost = 600m,
                ActualCost = 550m,
                ReportedAt = new DateTime(2024, 6, 12),
                StartedAt = new DateTime(2024, 6, 14, 9, 0, 0),
                CompletedAt = new DateTime(2024, 6, 14, 17, 0, 0),
                DurationHours = 8,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.Tenant,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 12),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                RepairItem = "空调维修",
                Category = "家电",
                Description = "空调制冷效果差，需要加氟和清洗",
                EstimatedCost = 300m,
                ActualCost = 320m,
                ReportedAt = new DateTime(2024, 6, 10),
                StartedAt = new DateTime(2024, 6, 11, 14, 0, 0),
                CompletedAt = new DateTime(2024, 6, 11, 16, 30, 0),
                DurationHours = 2.5,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.PropertyManagement,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 10),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                RepairItem = "门锁更换",
                Category = "设施",
                Description = "入户门锁损坏，需要更换智能锁",
                EstimatedCost = 1200m,
                ActualCost = 1280m,
                ReportedAt = new DateTime(2024, 6, 5),
                StartedAt = new DateTime(2024, 6, 7, 10, 0, 0),
                CompletedAt = new DateTime(2024, 6, 7, 14, 0, 0),
                DurationHours = 4,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.Tenant,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 5),
                CreatedBy = "system"
            },
            new()
            {
                Id = Guid.NewGuid(),
                RepairItem = "油烟机清洗维修",
                Category = "家电",
                Description = "厨房油烟机大量积油，电机异响",
                EstimatedCost = 250m,
                ActualCost = 280m,
                ReportedAt = new DateTime(2024, 6, 8),
                StartedAt = new DateTime(2024, 6, 10, 9, 0, 0),
                CompletedAt = new DateTime(2024, 6, 10, 11, 0, 0),
                DurationHours = 2,
                AssignedToId = staffId,
                Responsibility = ResponsibilityParty.Tenant,
                Status = "已完成",
                CreatedAt = new DateTime(2024, 6, 8),
                CreatedBy = "system"
            }
        };
    }
}
