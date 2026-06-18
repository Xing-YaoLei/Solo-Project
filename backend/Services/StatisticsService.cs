using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppointmentDbContext _context;

    public StatisticsService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<StatisticsDto> GetOverviewAsync()
    {
        var totalAppointments = await _context.Appointments.CountAsync();
        var pendingCount = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.Pending);
        var inServiceCount = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.InService);
        var completedCount = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.Completed);
        var closedCount = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.Closed);

        var repairReturnRate = await GetRepairReturnRateAsync();

        return new StatisticsDto
        {
            TotalAppointments = totalAppointments,
            PendingCount = pendingCount,
            InServiceCount = inServiceCount,
            CompletedCount = completedCount,
            ClosedCount = closedCount,
            RepairReturnRate = repairReturnRate
        };
    }

    public async Task<StatisticsOverviewDto> GetOverviewAsync(DateTime? startDate, DateTime? endDate)
    {
        var start = startDate ?? DateTime.Now.AddMonths(-1);
        var end = endDate ?? DateTime.Now;

        var overview = new StatisticsOverviewDto
        {
            StartDate = start,
            EndDate = end,
            RepairRate = await GetRepairReturnStatsAsync(start, end),
            SourceDistribution = await GetSourceDistributionAsync(start, end),
            HandlerRanking = await GetPersonPerformanceAsync(start, end),
            ConclusionDistribution = await GetConclusionDistributionAsync(start, end)
        };

        return overview;
    }

    public async Task<List<SourceDistributionDto>> GetSourceDistributionAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Appointments.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(a => a.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.CreatedAt <= endDate.Value);

        var total = await query.CountAsync();

        var groups = await query
            .GroupBy(a => a.Source)
            .Select(g => new
            {
                Source = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var result = new List<SourceDistributionDto>();
        foreach (var group in groups)
        {
            result.Add(new SourceDistributionDto
            {
                Source = group.Source,
                SourceName = GetSourceName(group.Source),
                Count = group.Count,
                Percentage = total > 0 ? (decimal)group.Count / total * 100 : 0
            });
        }

        return result;
    }

    public async Task<List<PersonPerformanceDto>> GetPersonPerformanceAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Appointments.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(a => a.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.CreatedAt <= endDate.Value);

        query = query.Where(a => a.PersonInCharge != null);

        var groups = await query
            .GroupBy(a => a.PersonInCharge)
            .Select(g => new
            {
                PersonInCharge = g.Key!,
                TotalCount = g.Count()
            })
            .OrderByDescending(g => g.TotalCount)
            .ToListAsync();

        var result = new List<PersonPerformanceDto>();
        foreach (var group in groups)
        {
            var estimatedAmount = await CalculateEstimatedAmountAsync(group.PersonInCharge, startDate, endDate);

            result.Add(new PersonPerformanceDto
            {
                Name = group.PersonInCharge,
                Count = group.TotalCount,
                Amount = estimatedAmount
            });
        }

        return result;
    }

    public async Task<List<ConclusionDistributionDto>> GetConclusionDistributionAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.ServiceRecords.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(r => r.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(r => r.CreatedAt <= endDate.Value);

        query = query.Where(r => r.Conclusion != null && r.Conclusion != "");

        var groups = await query
            .GroupBy(r => r.Conclusion)
            .Select(g => new
            {
                Conclusion = g.Key!,
                Count = g.Count()
            })
            .OrderByDescending(g => g.Count)
            .ToListAsync();

        var total = groups.Sum(g => g.Count);

        var result = new List<ConclusionDistributionDto>();
        foreach (var group in groups)
        {
            result.Add(new ConclusionDistributionDto
            {
                Name = group.Conclusion,
                Value = group.Count,
                Percentage = total > 0 ? (decimal)group.Count / total * 100 : 0
            });
        }

        return result;
    }

    public async Task<decimal> GetRepairReturnRateAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var appointmentQuery = _context.Appointments.AsQueryable();

        if (startDate.HasValue)
            appointmentQuery = appointmentQuery.Where(a => a.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            appointmentQuery = appointmentQuery.Where(a => a.CreatedAt <= endDate.Value);

        var totalAppointments = await appointmentQuery
            .CountAsync(a => a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Closed);

        if (totalAppointments == 0)
            return 0;

        var repairReturnQuery = _context.RepairReturns.AsQueryable();

        if (startDate.HasValue)
            repairReturnQuery = repairReturnQuery.Where(r => r.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            repairReturnQuery = repairReturnQuery.Where(r => r.CreatedAt <= endDate.Value);

        var repairReturnCount = await repairReturnQuery.CountAsync();

        return (decimal)repairReturnCount / totalAppointments * 100;
    }

    public async Task<List<MonthlyStatisticsDto>> GetMonthlyStatisticsAsync(int year)
    {
        var result = new List<MonthlyStatisticsDto>();

        for (int month = 1; month <= 12; month++)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var appointmentCount = await _context.Appointments
                .CountAsync(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate);

            var completedCount = await _context.Appointments
                .CountAsync(a => (a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Closed)
                               && a.CompletionTime >= startDate && a.CompletionTime <= endDate);

            var totalRevenue = await _context.Quotes
                .Where(q => q.Status == QuoteStatus.Confirmed
                           && q.CreatedAt >= startDate && q.CreatedAt <= endDate)
                .SumAsync(q => q.TotalAmount);

            var monthlyStats = new MonthlyStatisticsDto
            {
                Year = year,
                Month = month,
                AppointmentCount = appointmentCount,
                CompletedCount = completedCount,
                TotalRevenue = totalRevenue,
                RepairReturnRate = 0
            };

            result.Add(monthlyStats);
        }

        return result;
    }

    private async Task<RepairReturnStatsDto> GetRepairReturnStatsAsync(DateTime startDate, DateTime endDate)
    {
        var appointmentQuery = _context.Appointments
            .Where(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate);

        var totalAppointments = await appointmentQuery
            .CountAsync(a => a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Closed);

        var repairReturnQuery = _context.RepairReturns
            .Include(r => r.NewAppointment)
                .ThenInclude(a => a!.Vehicle)
            .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate);

        var repairReturnCount = await repairReturnQuery.CountAsync();

        var repairReturnList = await repairReturnQuery
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .Select(r => new RepairReturnItemDto
            {
                Id = r.Id,
                OrderNo = r.NewAppointment!.AppointmentNo,
                PlateNumber = r.NewAppointment.Vehicle!.PlateNumber,
                ReworkReason = r.ReturnReason,
                Date = r.CreatedAt
            })
            .ToListAsync();

        return new RepairReturnStatsDto
        {
            Total = totalAppointments,
            Rework = repairReturnCount,
            Rate = totalAppointments > 0 ? (decimal)repairReturnCount / totalAppointments * 100 : 0,
            List = repairReturnList
        };
    }

    private async Task<decimal> CalculateEstimatedAmountAsync(string personInCharge, DateTime? startDate, DateTime? endDate)
    {
        var query = _context.Quotes
            .Include(q => q.Appointment)
            .Where(q => q.Appointment!.PersonInCharge == personInCharge
                       && q.Status == QuoteStatus.Confirmed);

        if (startDate.HasValue)
            query = query.Where(q => q.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(q => q.CreatedAt <= endDate.Value);

        var totalAmount = await query.SumAsync(q => q.TotalAmount);

        return totalAmount;
    }

    private static string GetSourceName(AppointmentSource source)
    {
        return source switch
        {
            AppointmentSource.WalkIn => "到店",
            AppointmentSource.Phone => "电话",
            AppointmentSource.Online => "线上",
            _ => source.ToString()
        };
    }
}
