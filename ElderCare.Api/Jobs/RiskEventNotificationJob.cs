using ElderCare.Api.Data;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Jobs;

public class RiskEventNotificationJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<RiskEventNotificationJob> _logger;

    public RiskEventNotificationJob(AppDbContext context, ILogger<RiskEventNotificationJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ProcessOpenRiskEvents()
    {
        _logger.LogInformation("Processing open risk events at {Time}", DateTime.UtcNow);

        var openEvents = await _context.RiskEvents
            .Where(r => r.Status == "Open")
            .ToListAsync();

        foreach (var riskEvent in openEvents)
        {
            var hasActiveReminder = await _context.RiskEventReminders
                .AnyAsync(r => r.RiskEventId == riskEvent.Id
                              && r.ActionType == ReminderActionType.Pushed
                              && r.IsSuccessful
                              && r.ActionTime > DateTime.UtcNow.AddMinutes(-30));

            if (!hasActiveReminder)
            {
                var reminder = new RiskEventReminder
                {
                    RiskEventId = riskEvent.Id,
                    ActionType = ReminderActionType.Pushed,
                    StaffId = riskEvent.AssignedStaffId,
                    Message = $"Risk event requires attention: {riskEvent.EventType} - {riskEvent.Description}",
                    ActionTime = DateTime.UtcNow,
                    IsSuccessful = true,
                    RetryCount = 0
                };
                _context.RiskEventReminders.Add(reminder);

                if (riskEvent.Status == "Open")
                {
                    riskEvent.Status = "Processing";
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Processed {Count} open risk events", openEvents.Count);
    }

    public async Task RetryFailedReminders()
    {
        _logger.LogInformation("Retrying failed risk event reminders at {Time}", DateTime.UtcNow);

        var failedReminders = await _context.RiskEventReminders
            .Where(r => !r.IsSuccessful && r.RetryCount < 3
                       && r.ActionType != ReminderActionType.Closed)
            .ToListAsync();

        foreach (var failed in failedReminders)
        {
            var retry = new RiskEventReminder
            {
                RiskEventId = failed.RiskEventId,
                ActionType = ReminderActionType.Retried,
                StaffId = failed.StaffId,
                Message = $"Retry notification: {failed.Message}",
                ActionTime = DateTime.UtcNow,
                IsSuccessful = false,
                RetryCount = failed.RetryCount + 1,
                ParentReminderId = failed.Id
            };
            _context.RiskEventReminders.Add(retry);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Created {Count} retry reminders", failedReminders.Count);
    }
}
