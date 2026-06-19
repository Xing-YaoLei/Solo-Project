namespace ScenicTicketBooking.Shared.DTOs;

public class MonthlyStatisticsDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthDisplay => $"{Year}-{Month:D2}";

    public int TotalBookings { get; set; }
    public int ConfirmedBookings { get; set; }
    public int ArrivedCount { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }
    public int RescheduledCount { get; set; }

    public decimal ArrivalRate => TotalBookings > 0 ? Math.Round((decimal)ArrivedCount / TotalBookings * 100, 2) : 0;
    public decimal NoShowRate => TotalBookings > 0 ? Math.Round((decimal)NoShowCount / TotalBookings * 100, 2) : 0;
    public decimal CancellationRate => TotalBookings > 0 ? Math.Round((decimal)CancelledCount / TotalBookings * 100, 2) : 0;

    public int TotalVisitors { get; set; }
    public decimal TotalRevenue { get; set; }
    public int ConflictCount { get; set; }
    public int ResolvedConflictCount { get; set; }

    public List<DailyStatisticsDto> DailyData { get; set; } = new();
    public List<ScenicSpotStatisticsDto> SpotData { get; set; } = new();
}

public class DailyStatisticsDto
{
    public DateOnly Date { get; set; }
    public string DateDisplay => Date.ToString("yyyy-MM-dd");
    public int TotalBookings { get; set; }
    public int ArrivedCount { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }
    public decimal ArrivalRate => TotalBookings > 0 ? Math.Round((decimal)ArrivedCount / TotalBookings * 100, 2) : 0;
    public int TotalVisitors { get; set; }
    public decimal Revenue { get; set; }
}

public class ScenicSpotStatisticsDto
{
    public Guid ScenicSpotId { get; set; }
    public string ScenicSpotName { get; set; } = string.Empty;
    public int TotalBookings { get; set; }
    public int ArrivedCount { get; set; }
    public int NoShowCount { get; set; }
    public decimal ArrivalRate => TotalBookings > 0 ? Math.Round((decimal)ArrivedCount / TotalBookings * 100, 2) : 0;
    public int TotalVisitors { get; set; }
    public decimal Revenue { get; set; }
}

public class StatisticsQueryDto
{
    public Guid? ScenicSpotId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}

public class ExportRequestDto
{
    public Guid? ScenicSpotId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? Status { get; set; }
    public string? SearchKeyword { get; set; }
    public string ExportType { get; set; } = "Bookings";
    public string FileFormat { get; set; } = "xlsx";

    [System.Text.Json.Serialization.JsonIgnore]
    public Dictionary<string, object?> FilterCriteria => new()
    {
        { "景区", ScenicSpotId.HasValue ? ScenicSpotId.Value.ToString() : "全部" },
        { "开始日期", StartDate?.ToString("yyyy-MM-dd") },
        { "结束日期", EndDate?.ToString("yyyy-MM-dd") },
        { "预约状态", Status.HasValue ? ((Domain.Enums.BookingStatus)Status.Value).ToString() : "全部" },
        { "搜索关键词", string.IsNullOrWhiteSpace(SearchKeyword) ? "无" : SearchKeyword },
        { "导出类型", ExportType },
        { "文件格式", FileFormat }
    };
}

public class ExportMetadataDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = string.Empty;
    public Dictionary<string, object?> FilterCriteria { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}
