using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface IApprovalService
{
    Task<ApprovalRecord> CreateApprovalRecordAsync(int scheduleId, int approverId, ApprovalStatus status, int level, string? comments = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ApprovalRecord>> GetApprovalRecordsByScheduleIdAsync(int scheduleId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ApprovalRecord>> GetPendingApprovalsAsync(int? approverId = null, int? level = null, CancellationToken cancellationToken = default);
    Task<ApprovalStatisticsDto> GetApprovalStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ApprovalTrendDto>> GetApprovalTrendAsync(int days = 30, CancellationToken cancellationToken = default);
    Task<IEnumerable<TodoItemDto>> GetUserTodosAsync(int userId, RoleType role, CancellationToken cancellationToken = default);
}
