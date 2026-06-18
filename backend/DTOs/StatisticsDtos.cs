using CarServiceAppointment.API.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CarServiceAppointment.API.DTOs;

public class StatisticsDto
{
    public int TotalAppointments { get; set; }
    public int PendingCount { get; set; }
    public int InServiceCount { get; set; }
    public int CompletedCount { get; set; }
    public int ClosedCount { get; set; }
    public decimal RepairReturnRate { get; set; }
}

public class StatisticsOverviewDto
{
    public RepairReturnStatsDto RepairRate { get; set; } = new();
    public List<SourceDistributionDto> SourceDistribution { get; set; } = new();
    public List<PersonPerformanceDto> HandlerRanking { get; set; } = new();
    public List<ConclusionDistributionDto> ConclusionDistribution { get; set; } = new();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class RepairReturnStatsDto
{
    public decimal Rate { get; set; }
    public int Total { get; set; }
    public int Rework { get; set; }
    public List<RepairReturnItemDto> List { get; set; } = new();
}

public class RepairReturnItemDto
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public string ReworkReason { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class SourceDistributionDto
{
    [JsonConverter(typeof(StringEnumConverter))]
    public AppointmentSource Source { get; set; }
    public string SourceName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class PersonPerformanceDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Amount { get; set; }
}

public class ConclusionDistributionDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public decimal Percentage { get; set; }
}

public class MonthlyStatisticsDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int AppointmentCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal RepairReturnRate { get; set; }
}
