namespace DentalClinic.API.DTOs;

public class ReportDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class AppointmentRateDto
{
    public DateTime Date { get; set; }
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int NoShowAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public double AttendanceRate { get; set; }
    public double NoShowRate { get; set; }
    public double ReAppointmentRate { get; set; }
}

public class ReAppointmentTrendDto
{
    public string Period { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalPatients { get; set; }
    public int ReAppointmentPatients { get; set; }
    public double ReAppointmentRate { get; set; }
    public int NewPatients { get; set; }
    public int TotalAppointments { get; set; }
}

public class DashboardStatsDto
{
    public int TodayAppointments { get; set; }
    public int TodayCompleted { get; set; }
    public int TodayNoShow { get; set; }
    public int PendingFollowUps { get; set; }
    public int TotalPatients { get; set; }
    public int ActiveTreatmentPlans { get; set; }
    public decimal TodayRevenue { get; set; }
    public double MonthlyReAppointmentRate { get; set; }
    public List<AppointmentRateDto>? WeeklyTrend { get; set; }
    public List<NoShowAppointmentDto>? HighRiskNoShows { get; set; }
}
