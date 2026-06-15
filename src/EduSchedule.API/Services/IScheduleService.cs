using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface IScheduleService
{
    Task<CourseSchedule> CreateScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default);
    Task<CourseSchedule> UpdateScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default);
    Task<bool> DeleteScheduleAsync(int id, CancellationToken cancellationToken = default);
    Task<CourseSchedule?> GetScheduleByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<CourseSchedule>> GetSchedulesAsync(int? semesterId = null, int? courseId = null, int? classroomId = null, CancellationToken cancellationToken = default);
    Task SubmitForApprovalAsync(int scheduleId, int userId, CancellationToken cancellationToken = default);
    Task ApproveScheduleAsync(int scheduleId, int approverId, string? comments = null, CancellationToken cancellationToken = default);
    Task RejectScheduleAsync(int scheduleId, int approverId, string comments, CancellationToken cancellationToken = default);
    Task<IEnumerable<Conflict>> DetectConflictsAsync(int semesterId, CancellationToken cancellationToken = default);
    Task<bool> CheckScheduleConflictAsync(CourseSchedule schedule, CancellationToken cancellationToken = default);
    Task<IEnumerable<CourseSchedule>> GetWeeklyScheduleAsync(int semesterId, int? classroomId = null, int? courseId = null, int? teacherId = null, CancellationToken cancellationToken = default);
}
