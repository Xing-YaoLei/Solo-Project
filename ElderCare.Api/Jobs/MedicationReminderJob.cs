using ElderCare.Api.Data;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Jobs;

public class MedicationReminderJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<MedicationReminderJob> _logger;

    public MedicationReminderJob(AppDbContext context, ILogger<MedicationReminderJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task GenerateDailyReminders()
    {
        _logger.LogInformation("Generating daily medication reminders at {Time}", DateTime.UtcNow);

        var today = DateTime.UtcNow.Date;
        var activeSchedules = await _context.MedicationSchedules
            .Where(s => s.Status == MedicationStatus.Active)
            .ToListAsync();

        foreach (var schedule in activeSchedules)
        {
            if (schedule.EndTime.HasValue && schedule.EndTime.Value.Date < today)
                continue;

            var times = schedule.TimeOfDay.Split(',', StringSplitOptions.RemoveEmptyEntries);
            foreach (var timeStr in times)
            {
                var trimmed = timeStr.Trim();
                if (!TimeSpan.TryParse(trimmed, out var timeOfDay)) continue;

                var reminderTime = today.Add(timeOfDay);

                var exists = await _context.MedicationReminderLogs
                    .AnyAsync(r => r.ScheduleId == schedule.Id
                                   && r.ElderlyId == schedule.ElderlyId
                                   && r.ReminderTime == reminderTime);

                if (!exists)
                {
                    var log = new MedicationReminderLog
                    {
                        ScheduleId = schedule.Id,
                        ElderlyId = schedule.ElderlyId,
                        ReminderTime = reminderTime,
                        Status = ReminderStatus.Pending
                    };
                    _context.MedicationReminderLogs.Add(log);
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Daily medication reminders generated successfully");
    }

    public async Task CheckMissedReminders()
    {
        _logger.LogInformation("Checking for missed medication reminders at {Time}", DateTime.UtcNow);

        var threshold = DateTime.UtcNow.AddHours(-1);
        var missedReminders = await _context.MedicationReminderLogs
            .Where(r => r.Status == ReminderStatus.Pending && r.ReminderTime < threshold)
            .ToListAsync();

        foreach (var reminder in missedReminders)
        {
            reminder.Status = ReminderStatus.Missed;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Marked {Count} reminders as missed", missedReminders.Count);
    }
}
