
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;

namespace MoveOutInspection.Infrastructure.Services;

public interface IBackgroundJobService
{
    Task CheckOverdueTodosAsync();
    Task CheckOverdueRentAsync();
    Task GenerateDailyReportAsync();
}

public class BackgroundJobService : IBackgroundJobService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public BackgroundJobService(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    public async Task CheckOverdueTodosAsync()
    {
        var now = DateTime.Now;
        var overdueTodos = await _unitOfWork.TodoTasks.FindAsync(
            t => t.Status == TodoStatus.Pending || t.Status == TodoStatus.InProgress
                && t.DueDate < now);

        foreach (var todo in overdueTodos)
        {
            if (todo.Status != TodoStatus.Overdue)
            {
                var previousStatus = todo.Status.ToString();
                todo.Status = TodoStatus.Overdue;
                todo.UpdatedAt = now;
                todo.UpdatedBy = "system";
                _unitOfWork.TodoTasks.Update(todo);

                if (todo.MoveOutOrderId.HasValue)
                {
                    await _timelineService.AddEventAsync(
                        todo.MoveOutOrderId.Value,
                        TimelineEventType.CustomAction,
                        "待办已逾期",
                        $"待办任务「{todo.Title}」已超过截止日期",
                        previousStatus,
                        TodoStatus.Overdue.ToString(),
                        null, null, null, "系统",
                        todo.Id.ToString(),
                        "TodoTask");
                }
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CheckOverdueRentAsync()
    {
        var now = DateTime.Now;
        var ordersWithPossibleOverdue = await _unitOfWork.MoveOutOrders.FindAsync(
            o => (o.Status == MoveOutStatus.Pending ||
                  o.Status == MoveOutStatus.Scheduled ||
                  o.Status == MoveOutStatus.Inspecting ||
                  o.Status == MoveOutStatus.AwaitingPayment)
                && o.Status != MoveOutStatus.OverdueRent);

        foreach (var order in ordersWithPossibleOverdue)
        {
            var existingOverdue = await _unitOfWork.RentOverdueRecords.FirstOrDefaultAsync(
                r => r.MoveOutOrderId == order.Id && !r.IsResolved);

            if (existingOverdue != null) continue;

            if (order.Tenant != null && order.MoveOutDate < now.AddDays(-7))
            {
                order.Status = MoveOutStatus.OverdueRent;
                order.UpdatedAt = now;
                order.UpdatedBy = "system";
                _unitOfWork.MoveOutOrders.Update(order);

                var overdueRecord = new RentOverdueRecord
                {
                    Id = Guid.NewGuid(),
                    MoveOutOrderId = order.Id,
                    OverdueDays = 7,
                    OverdueAmount = order.Tenant?.MonthlyRent ?? 0,
                    DueDate = order.MoveOutDate,
                    RecordedDate = now,
                    InitialResponsibility = ResponsibilityParty.Tenant,
                    FinalResponsibility = ResponsibilityParty.Tenant,
                    IsResolved = false,
                    CreatedAt = now,
                    CreatedBy = "system"
                };
                await _unitOfWork.RentOverdueRecords.AddAsync(overdueRecord);

                await _timelineService.AddEventAsync(
                    order.Id,
                    TimelineEventType.OverdueRecorded,
                    "租金逾期记录已生成",
                    $"系统检测到可能存在租金逾期情况，逾期金额：¥{overdueRecord.OverdueAmount}",
                    null, null, null, null, null, "系统",
                    overdueRecord.Id.ToString(),
                    "RentOverdueRecord");
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public Task GenerateDailyReportAsync()
    {
        return Task.CompletedTask;
    }
}
