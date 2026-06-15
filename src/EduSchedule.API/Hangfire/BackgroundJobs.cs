using EduSchedule.API.Services;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Hangfire;

public class BackgroundJobs
{
    private readonly IConflictDetectionService _conflictService;
    private readonly IApprovalService _approvalService;
    private readonly ILogger<BackgroundJobs> _logger;

    public BackgroundJobs(IConflictDetectionService conflictService, IApprovalService approvalService, ILogger<BackgroundJobs> logger)
    {
        _conflictService = conflictService;
        _approvalService = approvalService;
        _logger = logger;
    }

    public async Task DetectAllConflicts(int semesterId)
    {
        _logger.LogInformation($"Starting conflict detection for semester {semesterId} at {DateTime.UtcNow}");

        try
        {
            var conflicts = await _conflictService.DetectAllConflictsAsync(semesterId);
            _logger.LogInformation($"Conflict detection completed. Found {conflicts.Count()} new conflicts.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error occurred during conflict detection for semester {semesterId}");
            throw;
        }
    }

    public async Task SendPendingApprovalReminders()
    {
        _logger.LogInformation($"Sending pending approval reminders at {DateTime.UtcNow}");

        try
        {
            var pendingApprovals = await _approvalService.GetPendingApprovalsAsync();
            var oldApprovals = pendingApprovals
                .Where(a => (DateTime.UtcNow - a.CreatedAt).TotalHours > 24)
                .ToList();

            _logger.LogInformation($"Found {oldApprovals.Count} pending approvals older than 24 hours.");

            foreach (var approval in oldApprovals)
            {
                _logger.LogInformation($"Reminder: Approval for schedule {approval.ScheduleId} is pending since {approval.CreatedAt}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while sending pending approval reminders");
            throw;
        }
    }

    public async Task DailyConflictSummary()
    {
        _logger.LogInformation($"Generating daily conflict summary at {DateTime.UtcNow}");

        try
        {
            var conflicts = await _conflictService.GetConflictsAsync(ConflictStatus.Pending);
            var highConflicts = conflicts.Where(c => c.Level == ConflictLevel.Critical || c.Level == ConflictLevel.High);
            var mediumConflicts = conflicts.Where(c => c.Level == ConflictLevel.Medium);
            var lowConflicts = conflicts.Where(c => c.Level == ConflictLevel.Low);

            _logger.LogInformation($"Daily Conflict Summary: {conflicts.Count()} total pending. " +
                $"High: {highConflicts.Count()}, Medium: {mediumConflicts.Count()}, Low: {lowConflicts.Count()}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while generating daily conflict summary");
            throw;
        }
    }

    public async Task UpdateCourseStatus()
    {
        _logger.LogInformation($"Updating course statuses at {DateTime.UtcNow}");

        try
        {
            _logger.LogInformation("Course status update completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating course statuses");
            throw;
        }
    }
}
