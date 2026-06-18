using AutoRepair.Application.Interfaces;

namespace AutoRepair.Application.Jobs;

public class StockCheckJob
{
    private readonly IStockAlertService _stockAlertService;

    public StockCheckJob(IStockAlertService stockAlertService)
    {
        _stockAlertService = stockAlertService;
    }

    public async Task ExecuteAsync()
    {
        await _stockAlertService.CheckStockLevelsAndGenerateAlertsAsync();
    }
}

public class MaintenanceReminderJob
{
    private readonly IAppDbContext _context;

    public MaintenanceReminderJob(IAppDbContext context)
    {
        _context = context;
    }

    public async Task ExecuteAsync()
    {
        var today = DateTime.Today;
        var reminderDate = today.AddDays(7);

        var vehiclesDue = _context.Vehicles
            .Where(v => v.LastMaintenanceDate.HasValue
                && v.LastMaintenanceDate.Value.AddMonths(6) <= reminderDate)
            .ToList();

        foreach (var vehicle in vehiclesDue)
        {
            var exists = _context.MaintenanceReminders
                .Any(r => r.VehicleId == vehicle.Id
                    && r.Status == Domain.Entities.ReminderStatus.Pending);

            if (!exists)
            {
                _context.MaintenanceReminders.Add(new Domain.Entities.MaintenanceReminder
                {
                    Id = Guid.NewGuid(),
                    VehicleId = vehicle.Id,
                    ReminderType = "常规保养",
                    Description = $"{vehicle.Brand} {vehicle.Model} ({vehicle.LicensePlate}) 已到保养周期",
                    ScheduledDate = today.AddDays(3),
                    TriggerMileage = vehicle.NextMaintenanceMileage,
                    Status = Domain.Entities.ReminderStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
    }
}

public class DailyScheduleJob
{
    private readonly IAppDbContext _context;

    public DailyScheduleJob(IAppDbContext context)
    {
        _context = context;
    }

    public async Task ExecuteAsync()
    {
        var today = DateTime.Today;
        var ordersForToday = _context.WorkOrders
            .Where(w => w.ScheduledDate.Date == today
                && w.Status == Domain.Entities.WorkOrderStatus.Pending)
            .ToList();

        foreach (var order in ordersForToday)
        {
            order.Status = Domain.Entities.WorkOrderStatus.InProgress;
            order.StartedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}
