
using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using MoveOutInspection.Core.DTOs.Common;
using MoveOutInspection.Core.DTOs.Todo;
using MoveOutInspection.Core.Entities;
using MoveOutInspection.Core.Enums;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodoTasksController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITimelineService _timelineService;

    public TodoTasksController(IUnitOfWork unitOfWork, ITimelineService timelineService)
    {
        _unitOfWork = unitOfWork;
        _timelineService = timelineService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TodoTaskDto>>> GetTodos([FromQuery] TodoQueryDto query)
    {
        Expression<Func<TodoTask, bool>>? predicate = null;
        var predicates = new List<Expression<Func<TodoTask, bool>>>();

        if (query.Status.HasValue)
            predicates.Add(t => t.Status == query.Status.Value);
        if (query.Priority.HasValue)
            predicates.Add(t => t.Priority == query.Priority.Value);
        if (query.AssignedToId.HasValue)
            predicates.Add(t => t.AssignedToId == query.AssignedToId.Value);
        if (query.DueDateFrom.HasValue)
            predicates.Add(t => t.DueDate >= query.DueDateFrom.Value);
        if (query.DueDateTo.HasValue)
            predicates.Add(t => t.DueDate <= query.DueDateTo.Value);
        if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            predicates.Add(t =>
                t.Title.Contains(query.SearchKeyword) ||
                t.TaskNo.Contains(query.SearchKeyword));

        if (predicates.Any())
        {
            var param = Expression.Parameter(typeof(TodoTask), "t");
            Expression? combined = null;
            foreach (var p in predicates)
            {
                var invoked = Expression.Invoke(p, param);
                combined = combined == null ? invoked : Expression.AndAlso(combined, invoked);
            }
            predicate = Expression.Lambda<Func<TodoTask, bool>>(combined, param);
        }

        var result = await _unitOfWork.TodoTasks.GetPagedAsync(
            predicate,
            t => t.DueDate,
            true,
            query.PageNumber,
            query.PageSize);

        var dtos = new List<TodoTaskDto>();
        foreach (var todo in result.Items)
        {
            var assignedTo = await _unitOfWork.Staffs.GetByIdAsync(todo.AssignedToId);
            var createdBy = todo.CreatedById.HasValue
                ? await _unitOfWork.Staffs.GetByIdAsync(todo.CreatedById.Value)
                : null;
            MoveOutOrder? order = null;
            if (todo.MoveOutOrderId.HasValue)
                order = await _unitOfWork.MoveOutOrders.GetByIdAsync(todo.MoveOutOrderId.Value);
            Apartment? apartment = null;
            if (order != null)
                apartment = await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId);

            dtos.Add(new TodoTaskDto
            {
                Id = todo.Id,
                TaskNo = todo.TaskNo,
                MoveOutOrderId = todo.MoveOutOrderId,
                OrderNumber = order?.OrderNumber,
                ApartmentNumber = apartment?.ApartmentNumber,
                Title = todo.Title,
                Description = todo.Description,
                Status = todo.Status,
                Priority = todo.Priority,
                Category = todo.Category,
                AssignedToId = todo.AssignedToId,
                AssignedToName = assignedTo?.Name,
                CreatedByName = createdBy?.Name,
                DueDate = todo.DueDate,
                StartedAt = todo.StartedAt,
                CompletedAt = todo.CompletedAt,
                Result = todo.Result,
                AttachmentUrls = todo.AttachmentUrls,
                CreatedAt = todo.CreatedAt
            });
        }

        return Ok(new PagedResult<TodoTaskDto>
        {
            Items = dtos,
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoTaskDto>> GetTodo(Guid id)
    {
        var todo = await _unitOfWork.TodoTasks.GetByIdAsync(id);
        if (todo == null) return NotFound();

        var assignedTo = await _unitOfWork.Staffs.GetByIdAsync(todo.AssignedToId);
        var createdBy = todo.CreatedById.HasValue
            ? await _unitOfWork.Staffs.GetByIdAsync(todo.CreatedById.Value)
            : null;
        MoveOutOrder? order = null;
        if (todo.MoveOutOrderId.HasValue)
            order = await _unitOfWork.MoveOutOrders.GetByIdAsync(todo.MoveOutOrderId.Value);
        Apartment? apartment = null;
        if (order != null)
            apartment = await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId);

        return Ok(new TodoTaskDto
        {
            Id = todo.Id,
            TaskNo = todo.TaskNo,
            MoveOutOrderId = todo.MoveOutOrderId,
            OrderNumber = order?.OrderNumber,
            ApartmentNumber = apartment?.ApartmentNumber,
            Title = todo.Title,
            Description = todo.Description,
            Status = todo.Status,
            Priority = todo.Priority,
            Category = todo.Category,
            AssignedToId = todo.AssignedToId,
            AssignedToName = assignedTo?.Name,
            CreatedByName = createdBy?.Name,
            DueDate = todo.DueDate,
            StartedAt = todo.StartedAt,
            CompletedAt = todo.CompletedAt,
            Result = todo.Result,
            AttachmentUrls = todo.AttachmentUrls,
            CreatedAt = todo.CreatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<TodoTaskDto>> CreateTodo([FromBody] CreateTodoTaskDto dto)
    {
        var taskNo = $"TODO{DateTime.Now:yyyyMM}{(await _unitOfWork.TodoTasks.CountAsync() + 1):D3}";
        var todo = new TodoTask
        {
            Id = Guid.NewGuid(),
            TaskNo = taskNo,
            MoveOutOrderId = dto.MoveOutOrderId,
            Title = dto.Title,
            Description = dto.Description,
            Status = TodoStatus.Pending,
            Priority = dto.Priority,
            Category = dto.Category,
            AssignedToId = dto.AssignedToId,
            DueDate = dto.DueDate,
            AttachmentUrls = dto.AttachmentUrls,
            CreatedAt = DateTime.Now,
            CreatedBy = "system"
        };

        await _unitOfWork.TodoTasks.AddAsync(todo);
        await _unitOfWork.SaveChangesAsync();

        if (dto.MoveOutOrderId.HasValue)
        {
            var assignedTo = await _unitOfWork.Staffs.GetByIdAsync(dto.AssignedToId);
            await _timelineService.AddEventAsync(
                dto.MoveOutOrderId.Value,
                TimelineEventType.CustomAction,
                "待办任务已创建",
                $"待办任务「{dto.Title}」已创建并指派给 {assignedTo?.Name}",
                null, null, null, dto.AttachmentUrls, dto.AssignedToId, assignedTo?.Name,
                todo.Id.ToString(),
                nameof(TodoTask));
        }

        return CreatedAtAction(nameof(GetTodo), new { id = todo.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTodo(Guid id, [FromBody] UpdateTodoTaskDto dto)
    {
        var todo = await _unitOfWork.TodoTasks.GetByIdAsync(id);
        if (todo == null) return NotFound();

        if (dto.Status.HasValue && dto.Status.Value != todo.Status)
        {
            var oldStatus = todo.Status;
            todo.Status = dto.Status.Value;
            if (dto.Status.Value == TodoStatus.InProgress && !todo.StartedAt.HasValue)
                todo.StartedAt = DateTime.Now;
            if (dto.Status.Value == TodoStatus.Completed && !todo.CompletedAt.HasValue)
                todo.CompletedAt = DateTime.Now;

            if (todo.MoveOutOrderId.HasValue)
            {
                await _timelineService.AddEventAsync(
                    todo.MoveOutOrderId.Value,
                    TimelineEventType.CustomAction,
                    "待办状态已更新",
                    $"待办任务「{todo.Title}」状态由 {oldStatus} 变更为 {dto.Status.Value}",
                    oldStatus.ToString(),
                    dto.Status.Value.ToString(),
                    null, null, null, "系统",
                    todo.Id.ToString(),
                    nameof(TodoTask));
            }
        }

        todo.Description = dto.Description ?? todo.Description;
        todo.DueDate = dto.DueDate ?? todo.DueDate;
        todo.Result = dto.Result ?? todo.Result;
        todo.AttachmentUrls = dto.AttachmentUrls ?? todo.AttachmentUrls;
        todo.UpdatedAt = DateTime.Now;
        todo.UpdatedBy = "system";

        _unitOfWork.TodoTasks.Update(todo);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteTodo(Guid id, [FromQuery] string? result)
    {
        var todo = await _unitOfWork.TodoTasks.GetByIdAsync(id);
        if (todo == null) return NotFound();

        todo.Status = TodoStatus.Completed;
        todo.CompletedAt = DateTime.Now;
        todo.Result = result ?? todo.Result;
        todo.UpdatedAt = DateTime.Now;
        todo.UpdatedBy = "system";

        _unitOfWork.TodoTasks.Update(todo);
        await _unitOfWork.SaveChangesAsync();

        if (todo.MoveOutOrderId.HasValue)
        {
            await _timelineService.AddEventAsync(
                todo.MoveOutOrderId.Value,
                TimelineEventType.CustomAction,
                "待办任务已完成",
                $"待办任务「{todo.Title}」已完成{(result != null ? $"，处理结果：{result}" : "")}",
                null, null, result, null, null, "系统",
                todo.Id.ToString(),
                nameof(TodoTask));
        }

        return NoContent();
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateTodoStatus(Guid id, [FromBody] TodoStatusDto dto)
    {
        var todo = await _unitOfWork.TodoTasks.GetByIdAsync(id);
        if (todo == null) return NotFound();

        var oldStatus = todo.Status;
        todo.Status = dto.Status;
        if (dto.Status == TodoStatus.InProgress && !todo.StartedAt.HasValue)
            todo.StartedAt = DateTime.Now;
        if (dto.Status == TodoStatus.Completed && !todo.CompletedAt.HasValue)
            todo.CompletedAt = DateTime.Now;
        todo.UpdatedAt = DateTime.Now;
        todo.UpdatedBy = "system";

        _unitOfWork.TodoTasks.Update(todo);
        await _unitOfWork.SaveChangesAsync();

        if (todo.MoveOutOrderId.HasValue)
        {
            await _timelineService.AddEventAsync(
                todo.MoveOutOrderId.Value,
                TimelineEventType.CustomAction,
                "待办状态已更新",
                $"待办任务「{todo.Title}」状态由 {oldStatus} 变更为 {dto.Status}",
                oldStatus.ToString(),
                dto.Status.ToString(),
                null, null, null, "系统",
                todo.Id.ToString(),
                nameof(TodoTask));
        }

        return NoContent();
    }

    [HttpGet("mine")]
    public async Task<ActionResult<PagedResult<TodoTaskDto>>> GetMyTodos([FromQuery] TodoQueryDto query)
    {
        var staffId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        query.AssignedToId = staffId;
        return await GetTodos(query);
    }

    [HttpGet("order/{orderId}")]
    public async Task<ActionResult<IEnumerable<TodoTaskDto>>> GetTodosByOrderId(Guid orderId)
    {
        var todos = await _unitOfWork.TodoTasks.FindAsync(t => t.MoveOutOrderId == orderId);
        var dtos = new List<TodoTaskDto>();

        foreach (var todo in todos)
        {
            var assignedTo = await _unitOfWork.Staffs.GetByIdAsync(todo.AssignedToId);
            var createdBy = todo.CreatedById.HasValue
                ? await _unitOfWork.Staffs.GetByIdAsync(todo.CreatedById.Value)
                : null;
            var order = await _unitOfWork.MoveOutOrders.GetByIdAsync(orderId);
            var apartment = order != null ? await _unitOfWork.Apartments.GetByIdAsync(order.ApartmentId) : null;

            dtos.Add(new TodoTaskDto
            {
                Id = todo.Id,
                TaskNo = todo.TaskNo,
                MoveOutOrderId = todo.MoveOutOrderId,
                OrderNumber = order?.OrderNumber,
                ApartmentNumber = apartment?.ApartmentNumber,
                Title = todo.Title,
                Description = todo.Description,
                Status = todo.Status,
                Priority = todo.Priority,
                Category = todo.Category,
                AssignedToId = todo.AssignedToId,
                AssignedToName = assignedTo?.Name,
                CreatedByName = createdBy?.Name,
                DueDate = todo.DueDate,
                StartedAt = todo.StartedAt,
                CompletedAt = todo.CompletedAt,
                Result = todo.Result,
                AttachmentUrls = todo.AttachmentUrls,
                CreatedAt = todo.CreatedAt
            });
        }

        return Ok(dtos);
    }
}
