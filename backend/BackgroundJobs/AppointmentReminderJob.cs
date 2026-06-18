using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.BackgroundJobs;

public class AppointmentReminderJob
{
    private readonly AppointmentDbContext _context;
    private readonly ILogger<AppointmentReminderJob> _logger;

    public AppointmentReminderJob(AppointmentDbContext context, ILogger<AppointmentReminderJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendRemindersAsync()
    {
        _logger.LogInformation("开始发送预约进厂提醒...");

        try
        {
            var now = DateTime.Now;
            var twoHoursLater = now.AddHours(2);

            var upcomingAppointments = await _context.Appointments
                .Include(a => a.Vehicle)
                .Where(a => a.Status == AppointmentStatus.Pending
                    && a.AppointmentTime >= now
                    && a.AppointmentTime <= twoHoursLater)
                .OrderBy(a => a.AppointmentTime)
                .ToListAsync();

            if (upcomingAppointments.Any())
            {
                _logger.LogInformation("发现 {Count} 个即将在2小时内进厂的预约：", upcomingAppointments.Count);
                foreach (var appointment in upcomingAppointments)
                {
                    _logger.LogInformation("  - 预约单: {AppointmentNo}, 车牌号: {PlateNumber}, 车主: {OwnerName}, 预约时间: {AppointmentTime}, 电话: {Phone}",
                        appointment.AppointmentNo,
                        appointment.Vehicle?.PlateNumber ?? "未知",
                        appointment.Vehicle?.OwnerName ?? "未知",
                        appointment.AppointmentTime,
                        appointment.Vehicle?.OwnerPhone ?? "未知");
                }
            }
            else
            {
                _logger.LogInformation("当前没有即将进厂的预约需要提醒");
            }

            _logger.LogInformation("预约提醒发送完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "发送预约提醒过程中发生错误");
            throw;
        }
    }
}
