using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Application.Services;

public interface IReminderListService
{
    Task<IEnumerable<ReminderListDto>> GetAllReminderListsAsync(Guid? scenicSpotId = null, CancellationToken cancellationToken = default);
    Task<ReminderListDto?> GetReminderListByIdAsync(Guid id, bool includeChangeLogs = false, CancellationToken cancellationToken = default);
    Task<ReminderListDto> CreateReminderListAsync(CreateReminderListDto dto, CancellationToken cancellationToken = default);
    Task<ReminderListDto> UpdateReminderListAsync(Guid id, UpdateReminderListDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteReminderListAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ReminderListChangeLogDto>> GetChangeLogsAsync(Guid reminderListId, CancellationToken cancellationToken = default);
}

public class ReminderListService : IReminderListService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReminderListService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ReminderListDto>> GetAllReminderListsAsync(Guid? scenicSpotId = null, CancellationToken cancellationToken = default)
    {
        IQueryable<ReminderList> queryable = _unitOfWork.Query<ReminderList>()
            .Include(r => r.Items)
            .Include(r => r.ScenicSpot);

        if (scenicSpotId.HasValue)
            queryable = queryable.Where(r => !r.ScenicSpotId.HasValue || r.ScenicSpotId == scenicSpotId.Value);

        queryable = queryable.OrderByDescending(r => r.CreatedAt);

        var entities = await queryable.ToListAsync(cancellationToken);
        return entities.Select(r => MapToDto(r, false)).ToList();
    }

    public async Task<ReminderListDto?> GetReminderListByIdAsync(Guid id, bool includeChangeLogs = false, CancellationToken cancellationToken = default)
    {
        IQueryable<ReminderList> queryable = _unitOfWork.Query<ReminderList>()
            .Include(r => r.Items)
            .Include(r => r.ScenicSpot);

        if (includeChangeLogs)
            queryable = queryable.Include(r => r.ChangeLogs);

        var list = await queryable.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        return list != null ? MapToDto(list, includeChangeLogs) : null;
    }

    public async Task<ReminderListDto> CreateReminderListAsync(CreateReminderListDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var list = new ReminderList
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                ScenicSpotId = dto.ScenicSpotId,
                IsActive = true,
                CreatedBy = dto.CreatedBy ?? "System",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReminderLists.AddAsync(list, cancellationToken);

            var items = dto.Items.Select(i => new ReminderListItem
            {
                Id = Guid.NewGuid(),
                ReminderListId = list.Id,
                PersonName = i.PersonName,
                PhoneNumber = i.PhoneNumber,
                Email = i.Email,
                IdCardNumber = i.IdCardNumber,
                Role = i.Role,
                SortOrder = i.SortOrder,
                ReceiveConflictNotifications = i.ReceiveConflictNotifications,
                ReceiveDailySummary = i.ReceiveDailySummary,
                ReceiveMonthlyReport = i.ReceiveMonthlyReport,
                IsActive = i.IsActive,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            foreach (var item in items)
            {
                await _unitOfWork.ReminderListItems.AddAsync(item, cancellationToken);

                var changeLog = new ReminderListChangeLog
                {
                    Id = Guid.NewGuid(),
                    ReminderListId = list.Id,
                    ReminderListItemId = item.Id,
                    ChangeType = "Create",
                    FieldName = "Item",
                    OldValue = null,
                    NewValue = item.PersonName,
                    NewValuesSnapshot = JsonSerializer.Serialize(ItemToSnapshot(item)),
                    ChangedBy = dto.CreatedBy ?? "System",
                    ChangeReason = "新增成员",
                    ChangedAt = DateTime.UtcNow
                };
                await _unitOfWork.ReminderListChangeLogs.AddAsync(changeLog, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return await GetReminderListByIdAsync(list.Id, true, cancellationToken)
                ?? throw new InvalidOperationException("创建提醒名单后读取失败");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ReminderListDto> UpdateReminderListAsync(Guid id, UpdateReminderListDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var list = await _unitOfWork.Query<ReminderList>()
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
                ?? throw new InvalidOperationException($"提醒名单不存在: {id}");

            var oldListSnapshot = ListToSnapshot(list);
            var changeReason = dto.ChangeReason ?? "更新提醒名单";
            var changedBy = dto.UpdatedBy ?? "System";

            if (list.Name != dto.Name)
            {
                await LogChangeAsync(list.Id, null, "Update", nameof(list.Name),
                    list.Name, dto.Name, null, null, changedBy, changeReason, cancellationToken);
                list.Name = dto.Name;
            }

            if (list.Description != dto.Description)
            {
                await LogChangeAsync(list.Id, null, "Update", nameof(list.Description),
                    list.Description, dto.Description, null, null, changedBy, changeReason, cancellationToken);
                list.Description = dto.Description;
            }

            if (list.ScenicSpotId != dto.ScenicSpotId)
            {
                await LogChangeAsync(list.Id, null, "Update", nameof(list.ScenicSpotId),
                    list.ScenicSpotId?.ToString(), dto.ScenicSpotId?.ToString(), null, null, changedBy, changeReason, cancellationToken);
                list.ScenicSpotId = dto.ScenicSpotId;
            }

            if (list.IsActive != dto.IsActive)
            {
                await LogChangeAsync(list.Id, null, "Update", nameof(list.IsActive),
                    list.IsActive.ToString(), dto.IsActive.ToString(), null, null, changedBy, changeReason, cancellationToken);
                list.IsActive = dto.IsActive;
            }

            var existingItems = list.Items.ToDictionary(i => i.Id);
            var incomingItems = dto.Items.Where(i => i.Id != Guid.Empty).ToDictionary(i => i.Id);
            var newItems = dto.Items.Where(i => i.Id == Guid.Empty).ToList();

            foreach (var existingItem in existingItems.Values)
            {
                if (!incomingItems.ContainsKey(existingItem.Id))
                {
                    var oldSnapshot = ItemToSnapshot(existingItem);
                    await LogChangeAsync(list.Id, existingItem.Id, "Delete", "Item",
                        existingItem.PersonName, null, oldSnapshot, null, changedBy, changeReason + " - 移除成员", cancellationToken);

                    _unitOfWork.ReminderListItems.Delete(existingItem);
                }
                else
                {
                    var incoming = incomingItems[existingItem.Id];
                    var oldSnapshot = ItemToSnapshot(existingItem);
                    var changes = new List<string>();

                    if (existingItem.PersonName != incoming.PersonName)
                    {
                        changes.Add($"姓名: {existingItem.PersonName} -> {incoming.PersonName}");
                        existingItem.PersonName = incoming.PersonName;
                    }
                    if (existingItem.PhoneNumber != incoming.PhoneNumber)
                    {
                        changes.Add($"电话: {existingItem.PhoneNumber} -> {incoming.PhoneNumber}");
                        existingItem.PhoneNumber = incoming.PhoneNumber;
                    }
                    if (existingItem.Email != incoming.Email)
                    {
                        changes.Add($"邮箱: {existingItem.Email} -> {incoming.Email}");
                        existingItem.Email = incoming.Email;
                    }
                    if (existingItem.IdCardNumber != incoming.IdCardNumber)
                    {
                        changes.Add($"身份证: {existingItem.IdCardNumber} -> {incoming.IdCardNumber}");
                        existingItem.IdCardNumber = incoming.IdCardNumber;
                    }
                    if (existingItem.Role != incoming.Role)
                    {
                        changes.Add($"角色: {existingItem.Role} -> {incoming.Role}");
                        existingItem.Role = incoming.Role;
                    }
                    if (existingItem.ReceiveConflictNotifications != incoming.ReceiveConflictNotifications)
                    {
                        changes.Add($"接收冲突通知: {existingItem.ReceiveConflictNotifications} -> {incoming.ReceiveConflictNotifications}");
                        existingItem.ReceiveConflictNotifications = incoming.ReceiveConflictNotifications;
                    }
                    if (existingItem.ReceiveDailySummary != incoming.ReceiveDailySummary)
                    {
                        changes.Add($"接收日报: {existingItem.ReceiveDailySummary} -> {incoming.ReceiveDailySummary}");
                        existingItem.ReceiveDailySummary = incoming.ReceiveDailySummary;
                    }
                    if (existingItem.ReceiveMonthlyReport != incoming.ReceiveMonthlyReport)
                    {
                        changes.Add($"接收月报: {existingItem.ReceiveMonthlyReport} -> {incoming.ReceiveMonthlyReport}");
                        existingItem.ReceiveMonthlyReport = incoming.ReceiveMonthlyReport;
                    }
                    if (existingItem.IsActive != incoming.IsActive)
                    {
                        changes.Add($"启用状态: {existingItem.IsActive} -> {incoming.IsActive}");
                        existingItem.IsActive = incoming.IsActive;
                    }

                    if (changes.Any())
                    {
                        var newSnapshot = ItemDtoToSnapshot(incoming);
                        await LogChangeAsync(list.Id, existingItem.Id, "Update", "Item",
                            string.Join("; ", changes), null, oldSnapshot, newSnapshot, changedBy, changeReason, cancellationToken);
                    }

                    existingItem.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.ReminderListItems.Update(existingItem);
                }
            }

            foreach (var newItem in newItems)
            {
                var item = new ReminderListItem
                {
                    Id = Guid.NewGuid(),
                    ReminderListId = list.Id,
                    PersonName = newItem.PersonName,
                    PhoneNumber = newItem.PhoneNumber,
                    Email = newItem.Email,
                    IdCardNumber = newItem.IdCardNumber,
                    Role = newItem.Role,
                    SortOrder = newItem.SortOrder,
                    ReceiveConflictNotifications = newItem.ReceiveConflictNotifications,
                    ReceiveDailySummary = newItem.ReceiveDailySummary,
                    ReceiveMonthlyReport = newItem.ReceiveMonthlyReport,
                    IsActive = newItem.IsActive,
                    CreatedAt = DateTime.UtcNow
                };
                await _unitOfWork.ReminderListItems.AddAsync(item, cancellationToken);

                var newSnapshot = ItemToSnapshot(item);
                await LogChangeAsync(list.Id, item.Id, "Create", "Item",
                    null, item.PersonName, null, newSnapshot, changedBy, changeReason + " - 新增成员", cancellationToken);
            }

            list.UpdatedBy = dto.UpdatedBy;
            list.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.ReminderLists.Update(list);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return await GetReminderListByIdAsync(list.Id, true, cancellationToken)
                ?? throw new InvalidOperationException("更新提醒名单后读取失败");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> DeleteReminderListAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var list = await _unitOfWork.ReminderLists.GetByIdAsync(id, cancellationToken);
        if (list == null) return false;

        _unitOfWork.ReminderLists.Delete(list);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<ReminderListChangeLogDto>> GetChangeLogsAsync(Guid reminderListId, CancellationToken cancellationToken = default)
    {
        var logs = await _unitOfWork.Query<ReminderListChangeLog>()
            .Where(l => l.ReminderListId == reminderListId)
            .OrderByDescending(l => l.ChangedAt)
            .Select(l => new
            {
                l.Id,
                l.ReminderListId,
                l.ReminderListItemId,
                l.ChangeType,
                l.FieldName,
                l.OldValue,
                l.NewValue,
                l.OldValuesSnapshot,
                l.NewValuesSnapshot,
                l.ChangeReason,
                l.ChangedBy,
                l.ChangedAt
            })
            .ToListAsync(cancellationToken);

        return logs.Select(l => new ReminderListChangeLogDto
        {
            Id = l.Id,
            ReminderListId = l.ReminderListId,
            ReminderListItemId = l.ReminderListItemId,
            ChangeType = l.ChangeType,
            FieldName = l.FieldName,
            OldValue = l.OldValue,
            NewValue = l.NewValue,
            OldValues = string.IsNullOrEmpty(l.OldValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(l.OldValuesSnapshot),
            NewValues = string.IsNullOrEmpty(l.NewValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(l.NewValuesSnapshot),
            ChangeReason = l.ChangeReason,
            ChangedBy = l.ChangedBy,
            ChangedAt = l.ChangedAt
        }).ToList();
    }

    private async Task LogChangeAsync(
        Guid reminderListId,
        Guid? itemId,
        string changeType,
        string fieldName,
        string? oldValue,
        string? newValue,
        Dictionary<string, object?>? oldSnapshot,
        Dictionary<string, object?>? newSnapshot,
        string changedBy,
        string reason,
        CancellationToken cancellationToken)
    {
        var log = new ReminderListChangeLog
        {
            Id = Guid.NewGuid(),
            ReminderListId = reminderListId,
            ReminderListItemId = itemId,
            ChangeType = changeType,
            FieldName = fieldName,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedBy = changedBy,
            ChangeReason = reason,
            ChangedAt = DateTime.UtcNow
        };

        if (oldSnapshot != null)
            log.OldValuesSnapshot = JsonSerializer.Serialize(oldSnapshot);
        if (newSnapshot != null)
            log.NewValuesSnapshot = JsonSerializer.Serialize(newSnapshot);

        await _unitOfWork.ReminderListChangeLogs.AddAsync(log, cancellationToken);
    }

    private static Dictionary<string, object?> ItemToSnapshot(ReminderListItem item)
    {
        return new Dictionary<string, object?>
        {
            [nameof(item.PersonName)] = item.PersonName,
            [nameof(item.PhoneNumber)] = item.PhoneNumber,
            [nameof(item.Email)] = item.Email,
            [nameof(item.IdCardNumber)] = item.IdCardNumber,
            [nameof(item.Role)] = item.Role,
            [nameof(item.ReceiveConflictNotifications)] = item.ReceiveConflictNotifications,
            [nameof(item.ReceiveDailySummary)] = item.ReceiveDailySummary,
            [nameof(item.ReceiveMonthlyReport)] = item.ReceiveMonthlyReport,
            [nameof(item.IsActive)] = item.IsActive
        };
    }

    private static Dictionary<string, object?> ItemDtoToSnapshot(ReminderListItemDto i)
    {
        return new Dictionary<string, object?>
        {
            [nameof(i.PersonName)] = i.PersonName,
            [nameof(i.PhoneNumber)] = i.PhoneNumber,
            [nameof(i.Email)] = i.Email,
            [nameof(i.IdCardNumber)] = i.IdCardNumber,
            [nameof(i.Role)] = i.Role,
            [nameof(i.ReceiveConflictNotifications)] = i.ReceiveConflictNotifications,
            [nameof(i.ReceiveDailySummary)] = i.ReceiveDailySummary,
            [nameof(i.ReceiveMonthlyReport)] = i.ReceiveMonthlyReport,
            [nameof(i.IsActive)] = i.IsActive
        };
    }

    private static Dictionary<string, object?> ListToSnapshot(ReminderList list)
    {
        return new Dictionary<string, object?>
        {
            [nameof(list.Name)] = list.Name,
            [nameof(list.Description)] = list.Description,
            [nameof(list.ScenicSpotId)] = list.ScenicSpotId,
            [nameof(list.IsActive)] = list.IsActive,
            ["Items"] = list.Items?.Select(ItemToSnapshot).ToList()
        };
    }

    private static ReminderListDto MapToDto(ReminderList r, bool includeChangeLogs)
    {
        var dto = new ReminderListDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            ScenicSpotId = r.ScenicSpotId,
            ScenicSpotName = r.ScenicSpot?.Name,
            IsActive = r.IsActive,
            CreatedBy = r.CreatedBy,
            CreatedAt = r.CreatedAt,
            UpdatedBy = r.UpdatedBy,
            UpdatedAt = r.UpdatedAt,
            Items = r.Items?.OrderBy(i => i.SortOrder).ThenBy(i => i.CreatedAt).Select(i => new ReminderListItemDto
            {
                Id = i.Id,
                ReminderListId = i.ReminderListId,
                PersonName = i.PersonName,
                PhoneNumber = i.PhoneNumber,
                Email = i.Email,
                IdCardNumber = i.IdCardNumber,
                Role = i.Role,
                SortOrder = i.SortOrder,
                ReceiveConflictNotifications = i.ReceiveConflictNotifications,
                ReceiveDailySummary = i.ReceiveDailySummary,
                ReceiveMonthlyReport = i.ReceiveMonthlyReport,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToList() ?? new()
        };

        if (includeChangeLogs && r.ChangeLogs != null)
        {
            dto.ChangeLogs = r.ChangeLogs
                .OrderByDescending(l => l.ChangedAt)
                .Select(l => new ReminderListChangeLogDto
                {
                    Id = l.Id,
                    ReminderListId = l.ReminderListId,
                    ReminderListItemId = l.ReminderListItemId,
                    ChangeType = l.ChangeType,
                    FieldName = l.FieldName,
                    OldValue = l.OldValue,
                    NewValue = l.NewValue,
                    OldValues = string.IsNullOrEmpty(l.OldValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(l.OldValuesSnapshot),
                    NewValues = string.IsNullOrEmpty(l.NewValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(l.NewValuesSnapshot),
                    ChangeReason = l.ChangeReason,
                    ChangedBy = l.ChangedBy,
                    ChangedAt = l.ChangedAt
                }).ToList();
        }

        return dto;
    }
}
