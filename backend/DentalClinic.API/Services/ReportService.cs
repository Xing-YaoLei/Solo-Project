using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;
using DentalClinic.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var nextMonth = monthStart.AddMonths(1);

        var todayAppointments = await _context.Appointments
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
            .CountAsync();

        var todayCompleted = await _context.Appointments
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow
                     && a.Status == AppointmentStatus.Completed)
            .CountAsync();

        var todayNoShow = await _context.Appointments
            .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow
                     && a.Status == AppointmentStatus.NoShow)
            .CountAsync();

        var pendingFollowUps = await _context.FollowUpTasks
            .Where(f => f.Status == FollowUpStatus.Pending || f.Status == FollowUpStatus.InProgress)
            .CountAsync();

        var totalPatients = await _context.Patients.CountAsync();

        var activePlans = await _context.TreatmentPlans
            .Where(tp => tp.Status == TreatmentStatus.InProgress || tp.Status == TreatmentStatus.Planned)
            .CountAsync();

        var todayRevenue = await _context.BillingRecords
            .Where(b => b.BillingDate >= today && b.BillingDate < tomorrow)
            .SumAsync(b => b.PaidAmount);

        var weeklyTrend = await GetWeeklyTrendAsync();
        var highRiskNoShows = await GetHighRiskNoShowsAsync(10);

        var monthlyReAppointmentRate = await CalculateMonthlyReAppointmentRateAsync();

        return new DashboardStatsDto
        {
            TodayAppointments = todayAppointments,
            TodayCompleted = todayCompleted,
            TodayNoShow = todayNoShow,
            PendingFollowUps = pendingFollowUps,
            TotalPatients = totalPatients,
            ActiveTreatmentPlans = activePlans,
            TodayRevenue = todayRevenue,
            MonthlyReAppointmentRate = monthlyReAppointmentRate,
            WeeklyTrend = weeklyTrend.ToList(),
            HighRiskNoShows = highRiskNoShows.ToList()
        };
    }

    public async Task<IEnumerable<AppointmentRateDto>> GetAppointmentRatesAsync(DateTime startDate, DateTime endDate)
    {
        var results = new List<AppointmentRateDto>();

        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            var dayStart = date;
            var dayEnd = date.AddDays(1);

            var appointments = await _context.Appointments
                .Where(a => a.AppointmentDate >= dayStart && a.AppointmentDate < dayEnd)
                .ToListAsync();

            var total = appointments.Count;
            var completed = appointments.Count(a => a.Status == AppointmentStatus.Completed);
            var noShow = appointments.Count(a => a.Status == AppointmentStatus.NoShow);
            var cancelled = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);

            results.Add(new AppointmentRateDto
            {
                Date = date,
                TotalAppointments = total,
                CompletedAppointments = completed,
                NoShowAppointments = noShow,
                CancelledAppointments = cancelled,
                AttendanceRate = total > 0 ? (double)completed / total : 0,
                NoShowRate = total > 0 ? (double)noShow / total : 0,
                ReAppointmentRate = 0
            });
        }

        return results;
    }

    public async Task<IEnumerable<ReAppointmentTrendDto>> GetReAppointmentTrendAsync(int months = 6)
    {
        var results = new List<ReAppointmentTrendDto>();
        var today = DateTime.Today;

        for (int i = months - 1; i >= 0; i--)
        {
            var monthStart = new DateTime(today.Year, today.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);

            var monthPatients = await _context.Appointments
                .Where(a => a.AppointmentDate >= monthStart && a.AppointmentDate < monthEnd
                         && a.Status != AppointmentStatus.Cancelled)
                .Select(a => a.PatientId)
                .Distinct()
                .ToListAsync();

            var totalPatients = monthPatients.Count;

            var reAppointmentPatients = 0;
            foreach (var patientId in monthPatients)
            {
                var hasPriorAppointment = await _context.Appointments
                    .AnyAsync(a => a.PatientId == patientId
                                && a.AppointmentDate < monthStart
                                && a.Status != AppointmentStatus.Cancelled);
                if (hasPriorAppointment)
                {
                    reAppointmentPatients++;
                }
            }

            var newPatients = totalPatients - reAppointmentPatients;
            var totalAppointments = await _context.Appointments
                .CountAsync(a => a.AppointmentDate >= monthStart && a.AppointmentDate < monthEnd
                              && a.Status != AppointmentStatus.Cancelled);

            results.Add(new ReAppointmentTrendDto
            {
                Period = monthStart.ToString("yyyy-MM"),
                StartDate = monthStart,
                EndDate = monthEnd.AddDays(-1),
                TotalPatients = totalPatients,
                ReAppointmentPatients = reAppointmentPatients,
                ReAppointmentRate = totalPatients > 0 ? (double)reAppointmentPatients / totalPatients : 0,
                NewPatients = newPatients,
                TotalAppointments = totalAppointments
            });
        }

        return results;
    }

    public async Task<IEnumerable<NoShowAppointmentDto>> GetHighRiskNoShowsAsync(int topN = 10)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.Status == AppointmentStatus.NoShow || a.Status == AppointmentStatus.Scheduled)
            .OrderByDescending(a => a.RiskLevel)
            .ThenBy(a => a.AppointmentDate)
            .Take(topN)
            .Select(a => new NoShowAppointmentDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient!.Name,
                PatientPhone = a.Patient.Phone!,
                MemberLevel = a.Patient.MemberLevel,
                AppointmentDate = a.AppointmentDate,
                StartTime = a.StartTime,
                RiskLevel = a.RiskLevel,
                PatientNoShowCount = a.Patient.NoShowCount,
                CommunicationNotes = a.CommunicationNotes,
                ReviewComments = a.ReviewComments,
                HasFollowUp = a.FollowUpTasks.Any()
            })
            .ToListAsync();
    }

    private async Task<List<AppointmentRateDto>> GetWeeklyTrendAsync()
    {
        var today = DateTime.Today;
        var weekStart = today.AddDays(-6);
        var results = new List<AppointmentRateDto>();

        for (var date = weekStart; date <= today; date = date.AddDays(1))
        {
            var dayStart = date.Date;
            var dayEnd = date.AddDays(1);

            var appointments = await _context.Appointments
                .Where(a => a.AppointmentDate >= dayStart && a.AppointmentDate < dayEnd)
                .ToListAsync();

            var total = appointments.Count;
            var completed = appointments.Count(a => a.Status == AppointmentStatus.Completed);
            var noShow = appointments.Count(a => a.Status == AppointmentStatus.NoShow);
            var cancelled = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);

            results.Add(new AppointmentRateDto
            {
                Date = date,
                TotalAppointments = total,
                CompletedAppointments = completed,
                NoShowAppointments = noShow,
                CancelledAppointments = cancelled,
                AttendanceRate = total > 0 ? (double)completed / total : 0,
                NoShowRate = total > 0 ? (double)noShow / total : 0,
                ReAppointmentRate = 0
            });
        }

        return results;
    }

    private async Task<double> CalculateMonthlyReAppointmentRateAsync()
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var lastMonthStart = monthStart.AddMonths(-1);

        var lastMonthPatients = await _context.Appointments
            .Where(a => a.AppointmentDate >= lastMonthStart && a.AppointmentDate < monthStart
                     && a.Status != AppointmentStatus.Cancelled)
            .Select(a => a.PatientId)
            .Distinct()
            .ToListAsync();

        if (lastMonthPatients.Count == 0) return 0;

        var thisMonthReturning = await _context.Appointments
            .Where(a => a.AppointmentDate >= monthStart && a.AppointmentDate < monthStart.AddMonths(1)
                     && a.Status != AppointmentStatus.Cancelled
                     && lastMonthPatients.Contains(a.PatientId))
            .Select(a => a.PatientId)
            .Distinct()
            .CountAsync();

        return (double)thisMonthReturning / lastMonthPatients.Count;
    }
}
