using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.BackgroundJobs;

public class DataCleanupJob
{
    private readonly AppointmentDbContext _context;
    private readonly ILogger<DataCleanupJob> _logger;

    public DataCleanupJob(AppointmentDbContext context, ILogger<DataCleanupJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CleanupOldDataAsync()
    {
        _logger.LogInformation("开始数据清理任务...");

        try
        {
            var oneYearAgo = DateTime.Now.AddYears(-1);

            var oldClosedAppointments = await _context.Appointments
                .Where(a => a.Status == AppointmentStatus.Closed
                    && a.CloseTime <= oneYearAgo)
                .OrderBy(a => a.CloseTime)
                .ToListAsync();

            if (oldClosedAppointments.Any())
            {
                _logger.LogInformation("发现 {Count} 个已关闭超过1年的预约单，将进行归档处理：", oldClosedAppointments.Count);
                foreach (var appointment in oldClosedAppointments)
                {
                    _logger.LogInformation("  - 预约单: {AppointmentNo}, 关闭时间: {CloseTime}",
                        appointment.AppointmentNo,
                        appointment.CloseTime);
                }

                _logger.LogWarning("注意：当前实现仅记录日志，未实际删除数据。如需实际归档，请实现归档存储逻辑。");
            }
            else
            {
                _logger.LogInformation("没有发现已关闭超过1年的预约单需要清理");
            }

            _logger.LogInformation("数据清理任务完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据清理过程中发生错误");
            throw;
        }
    }
}
