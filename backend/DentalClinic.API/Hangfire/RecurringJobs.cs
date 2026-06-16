using DentalClinic.API.Data;
using DentalClinic.API.Enums;
using DentalClinic.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DentalClinic.API.Hangfire;

public class RecurringJobs
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RecurringJobs> _logger;

    public RecurringJobs(ApplicationDbContext context, ILogger<RecurringJobs> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendFollowUpReminders()
    {
        _logger.LogInformation("Starting follow-up reminders job at {Time}", DateTime.Now);

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var followUps = await _context.FollowUpTasks
            .Include(f => f.Patient)
            .Where(f => f.Status == FollowUpStatus.Pending
                     && f.ScheduledDate.HasValue
                     && f.ScheduledDate >= today
                     && f.ScheduledDate < tomorrow)
            .ToListAsync();

        foreach (var followUp in followUps)
        {
            try
            {
                _logger.LogInformation("Sending follow-up reminder for patient {PatientName} - {Title}",
                    followUp.Patient?.Name, followUp.Title);

                followUp.Status = FollowUpStatus.InProgress;
                followUp.UpdatedAt = DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process follow-up reminder for task {TaskId}", followUp.Id);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Follow-up reminders job completed. Processed {Count} tasks", followUps.Count);
    }

    public async Task SendAppointmentReminders()
    {
        _logger.LogInformation("Starting appointment reminders job at {Time}", DateTime.Now);

        var tomorrow = DateTime.Today.AddDays(1);
        var dayAfterTomorrow = tomorrow.AddDays(1);

        var appointments = await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.Status == AppointmentStatus.Scheduled
                     && a.AppointmentDate >= tomorrow
                     && a.AppointmentDate < dayAfterTomorrow
                     && !a.ReminderSentAt.HasValue)
            .ToListAsync();

        foreach (var appointment in appointments)
        {
            try
            {
                _logger.LogInformation("Sending appointment reminder for patient {PatientName} on {Date}",
                    appointment.Patient?.Name, appointment.AppointmentDate);

                appointment.ReminderSentAt = DateTime.Now;
                appointment.UpdatedAt = DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send appointment reminder for appointment {AppointmentId}", appointment.Id);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Appointment reminders job completed. Processed {Count} appointments", appointments.Count);
    }

    public async Task CheckNoShowAppointments()
    {
        _logger.LogInformation("Starting no-show appointment check job at {Time}", DateTime.Now);

        var today = DateTime.Today;
        var now = DateTime.Now.TimeOfDay;

        var appointments = await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.Status == AppointmentStatus.Scheduled
                     && a.AppointmentDate == today
                     && a.EndTime < now
                     && a.RiskLevel >= RiskLevel.Medium)
            .ToListAsync();

        foreach (var appointment in appointments)
        {
            try
            {
                _logger.LogInformation("Marking appointment {AppointmentId} for patient {PatientName} as potential no-show",
                    appointment.Id, appointment.Patient?.Name);

                var noShowTask = new FollowUpTask
                {
                    PatientId = appointment.PatientId,
                    AppointmentId = appointment.Id,
                    Type = FollowUpType.Phone,
                    Status = FollowUpStatus.Pending,
                    Title = "爽约跟进",
                    Content = $"患者{appointment.Patient?.Name}预约{appointment.AppointmentDate:yyyy-MM-dd} {appointment.StartTime}未到诊，需要电话跟进。",
                    ScheduledDate = today.AddDays(1),
                    AssignedTo = "前台",
                    CreatedAt = DateTime.Now
                };

                _context.FollowUpTasks.Add(noShowTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create no-show follow-up for appointment {AppointmentId}", appointment.Id);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("No-show appointment check job completed. Created {Count} follow-up tasks", appointments.Count);
    }
}
