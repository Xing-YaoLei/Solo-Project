using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface IConflictDetectionService
{
    Task<Conflict?> CheckConflictAsync(CourseSchedule schedule1, CourseSchedule schedule2, CancellationToken cancellationToken = default);
    Task DetectAndCreateConflictsForScheduleAsync(CourseSchedule schedule, CancellationToken cancellationToken = default);
    Task<IEnumerable<Conflict>> DetectAllConflictsAsync(int semesterId, CancellationToken cancellationToken = default);
    Task<ConflictLevel> CalculateConflictLevelAsync(Conflict conflict, CancellationToken cancellationToken = default);
    Task AssignConflictToUserAsync(int conflictId, int userId, CancellationToken cancellationToken = default);
    Task ResolveConflictAsync(int conflictId, int userId, string resolution, CancellationToken cancellationToken = default);
    Task AddCommunicationAsync(int conflictId, int userId, string message, CommunicationType type = CommunicationType.Comment, CancellationToken cancellationToken = default);
    Task AddReviewAsync(int conflictId, int reviewerId, string opinion, ReviewResult result, string? suggestions = null, CancellationToken cancellationToken = default);
    Task<Conflict?> GetConflictByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Conflict>> GetConflictsAsync(ConflictStatus? status = null, ConflictLevel? level = null, int? semesterId = null, CancellationToken cancellationToken = default);
}
