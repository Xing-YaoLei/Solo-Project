using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using EPPlus;
using EPPlus.Style;
using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Enums;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Application.Services;

public interface IStatisticsService
{
    Task<MonthlyStatisticsDto> GetMonthlyStatisticsAsync(StatisticsQueryDto query, CancellationToken cancellationToken = default);
}

public interface IExportService
{
    Task<(byte[] FileContent, ExportMetadataDto Metadata, string FileName)> ExportBookingsAsync(ExportRequestDto request, string operatorName, CancellationToken cancellationToken = default);
    Task<(byte[] FileContent, ExportMetadataDto Metadata, string FileName)> ExportMonthlyReportAsync(StatisticsQueryDto query, string operatorName, CancellationToken cancellationToken = default);
}

public class StatisticsService : IStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;

    public StatisticsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MonthlyStatisticsDto> GetMonthlyStatisticsAsync(StatisticsQueryDto query, CancellationToken cancellationToken = default)
    {
        var monthStart = new DateOnly(query.Year, query.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var result = new MonthlyStatisticsDto
        {
            Year = query.Year,
            Month = query.Month
        };

        var bookingQuery = (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Include(b => b.ScenicSpot)
            .Include(b => b.TimeSlot)
            .Include(b => b.TicketType)
            .Where(b => b.TimeSlot.Date >= monthStart && b.TimeSlot.Date <= monthEnd);

        if (query.ScenicSpotId.HasValue)
            bookingQuery = bookingQuery.Where(b => b.ScenicSpotId == query.ScenicSpotId.Value);

        var bookings = await bookingQuery.ToListAsync(cancellationToken);

        result.TotalBookings = bookings.Count;
        result.ConfirmedBookings = bookings.Count(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Rescheduled);
        result.ArrivedCount = bookings.Count(b => b.Status == BookingStatus.Arrived);
        result.NoShowCount = bookings.Count(b => b.Status == BookingStatus.NoShow);
        result.CancelledCount = bookings.Count(b => b.Status == BookingStatus.Cancelled);
        result.RescheduledCount = bookings.Count(b => b.Status == BookingStatus.Rescheduled);

        result.TotalVisitors = bookings.Sum(b => b.Quantity);
        result.TotalRevenue = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount);

        var conflictQuery = (_unitOfWork.ConflictLogs as IQueryable<ConflictLog>)!;

        if (query.ScenicSpotId.HasValue)
            conflictQuery = conflictQuery
                .Include(c => c.Booking)
                .Where(c => c.Booking != null && c.Booking.ScenicSpotId == query.ScenicSpotId.Value);
        conflictQuery = conflictQuery.Where(c => c.CreatedAt.Date >= monthStart.ToDateTime(TimeOnly.MinValue)
                                     && c.CreatedAt.Date <= monthEnd.ToDateTime(TimeOnly.MaxValue));

        var conflicts = await conflictQuery.ToListAsync(cancellationToken);

        result.ConflictCount = conflicts.Count;
        result.ResolvedConflictCount = conflicts.Count(c => c.Status == ConflictStatus.Resolved);

        var dailyData = new List<DailyStatisticsDto>();
        for (var day = monthStart; day <= monthEnd; day = day.AddDays(1))
        {
            var dayBookings = bookings.Where(b => b.TimeSlot.Date == day).ToList();
            dailyData.Add(new DailyStatisticsDto
            {
                Date = day,
                TotalBookings = dayBookings.Count,
                ArrivedCount = dayBookings.Count(b => b.Status == BookingStatus.Arrived),
                NoShowCount = dayBookings.Count(b => b.Status == BookingStatus.NoShow),
                CancelledCount = dayBookings.Count(b => b.Status == BookingStatus.Cancelled),
                TotalVisitors = dayBookings.Sum(b => b.Quantity),
                Revenue = dayBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount)
            });
        }
        result.DailyData = dailyData;

        var spotGroups = bookings.GroupBy(b => new { b.ScenicSpotId, b.ScenicSpot?.Name }).ToList();
        result.SpotData = spotGroups.Select(g => new ScenicSpotStatisticsDto
        {
            ScenicSpotId = g.Key.ScenicSpotId,
            ScenicSpotName = g.Key.Name ?? "未知景区",
            TotalBookings = g.Count(),
            ArrivedCount = g.Count(b => b.Status == BookingStatus.Arrived),
            NoShowCount = g.Count(b => b.Status == BookingStatus.NoShow),
            TotalVisitors = g.Sum(b => b.Quantity),
            Revenue = g.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount)
        }).ToList();

        return result;
    }
}

public class ExportService : IExportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStatisticsService _statisticsService;

    public ExportService(IUnitOfWork unitOfWork, IStatisticsService statisticsService)
    {
        _unitOfWork = unitOfWork;
        _statisticsService = statisticsService;
    }

    public async Task<(byte[] FileContent, ExportMetadataDto Metadata, string FileName)> ExportBookingsAsync(
        ExportRequestDto request,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var bookingQuery = (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Include(b => b.ScenicSpot)
            .Include(b => b.TimeSlot)
            .Include(b => b.TicketType)
            .Include(b => b.Visitor);

        if (request.ScenicSpotId.HasValue)
            bookingQuery = bookingQuery.Where(b => b.ScenicSpotId == request.ScenicSpotId.Value);

        if (request.StartDate.HasValue)
            bookingQuery = bookingQuery.Where(b => b.TimeSlot.Date >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            bookingQuery = bookingQuery.Where(b => b.TimeSlot.Date <= request.EndDate.Value);

        if (request.Status.HasValue)
            bookingQuery = bookingQuery.Where(b => (int)b.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchKeyword))
        {
            bookingQuery = bookingQuery.Where(b =>
                b.BookingNo.Contains(request.SearchKeyword) ||
                b.Visitor.Name.Contains(request.SearchKeyword) ||
                b.Visitor.IdCardNumber.Contains(request.SearchKeyword));
        }

        var bookings = await bookingQuery
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

        var rows = bookings.Select(b => new
        {
            预约编号 = b.BookingNo,
            景区名称 = b.ScenicSpot?.Name ?? "",
            预约日期 = b.TimeSlot?.Date.ToString("yyyy-MM-dd") ?? "",
            预约时段 = b.TimeSlot != null
                ? $"{b.TimeSlot.StartTime:hh\\:mm}-{b.TimeSlot.EndTime:hh\\:mm}"
                : "",
            票种 = b.TicketType?.Name ?? "",
            游客姓名 = b.Visitor?.Name ?? "",
            身份证号 = b.Visitor?.IdCardNumber ?? "",
            联系电话 = b.Visitor?.PhoneNumber ?? "",
            数量 = b.Quantity,
            金额 = b.TotalAmount.ToString("F2"),
            状态 = b.Status.ToString(),
            到场时间 = b.ArrivalTime?.ToString("yyyy-MM-dd HH:mm") ?? "",
            到场操作员 = b.ArrivalOperator ?? "",
            创建时间 = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            创建人 = b.CreatedBy ?? "",
            备注 = b.Remarks ?? ""
        }).ToList();

        var generatedAt = DateTime.Now;
        var summary = $"共导出 {rows.Count} 条预约记录";

        if (request.FileFormat.ToLower() == "csv")
        {
            var content = GenerateCsv(rows);
            var metadata = new ExportMetadataDto
            {
                FileName = $"门票预约记录_{generatedAt:yyyyMMddHHmmss}.csv",
                ContentType = "text/csv",
                GeneratedAt = generatedAt,
                GeneratedBy = operatorName,
                FilterCriteria = request.FilterCriteria,
                Summary = summary
            };
            return (Encoding.UTF8.GetBytes(content), metadata, metadata.FileName);
        }
        else
        {
            var content = GenerateExcel(rows, "门票预约记录", summary, request.FilterCriteria, operatorName, generatedAt);
            var metadata = new ExportMetadataDto
            {
                FileName = $"门票预约记录_{generatedAt:yyyyMMddHHmmss}.xlsx",
                ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                GeneratedAt = generatedAt,
                GeneratedBy = operatorName,
                FilterCriteria = request.FilterCriteria,
                Summary = summary
            };
            return (content, metadata, metadata.FileName);
        }
    }

    public async Task<(byte[] FileContent, ExportMetadataDto Metadata, string FileName)> ExportMonthlyReportAsync(
        StatisticsQueryDto query,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var stats = await _statisticsService.GetMonthlyStatisticsAsync(query, cancellationToken);

        var generatedAt = DateTime.Now;
        var summary = $"{query.Year}年{query.Month}月月度复盘报告 - 到场率 {stats.ArrivalRate}%";

        var filterCriteria = new Dictionary<string, object?>
        {
            { "统计年份", query.Year },
            { "统计月份", query.Month },
            { "景区", query.ScenicSpotId.HasValue ? query.ScenicSpotId.Value.ToString() : "全部" },
            { "导出类型", "月度复盘报告" }
        };

        var overviewRows = new List<object>
        {
            new { 指标 = "预约总数", 数值 = stats.TotalBookings },
            new { 指标 = "已确认预约", 数值 = stats.ConfirmedBookings },
            new { 指标 = "到场数", 数值 = stats.ArrivedCount },
            new { 指标 = "未到场数", 数值 = stats.NoShowCount },
            new { 指标 = "取消数", 数值 = stats.CancelledCount },
            new { 指标 = "改约数", 数值 = stats.RescheduledCount },
            new { 指标 = "到场率(%)", 数值 = $"{stats.ArrivalRate}%" },
            new { 指标 = "未到场率(%)", 数值 = $"{stats.NoShowRate}%" },
            new { 指标 = "取消率(%)", 数值 = $"{stats.CancellationRate}%" },
            new { 指标 = "游客总数", 数值 = stats.TotalVisitors },
            new { 指标 = "总收入(元)", 数值 = stats.TotalRevenue.ToString("F2") },
            new { 指标 = "冲突总数", 数值 = stats.ConflictCount },
            new { 指标 = "已解决冲突", 数值 = stats.ResolvedConflictCount }
        };

        var dailyRows = stats.DailyData.Select(d => new
        {
            日期 = d.DateDisplay,
            预约数 = d.TotalBookings,
            到场数 = d.ArrivedCount,
            未到场数 = d.NoShowCount,
            取消数 = d.CancelledCount,
            到场率 = $"{d.ArrivalRate}%",
            游客数 = d.TotalVisitors,
            收入_元_ = d.Revenue.ToString("F2")
        }).ToList<object>();

        var spotRows = stats.SpotData.Select(s => new
        {
            景区 = s.ScenicSpotName,
            预约数 = s.TotalBookings,
            到场数 = s.ArrivedCount,
            未到场数 = s.NoShowCount,
            到场率 = $"{s.ArrivalRate}%",
            游客数 = s.TotalVisitors,
            收入_元_ = s.Revenue.ToString("F2")
        }).ToList<object>();

        var excel = GenerateMonthlyExcel(
            overviewRows, dailyRows, spotRows,
            summary, filterCriteria, operatorName, generatedAt,
            query.Year, query.Month);

        var metadata = new ExportMetadataDto
        {
            FileName = $"月度复盘报告_{query.Year}{query.Month:D2}_{generatedAt:yyyyMMddHHmmss}.xlsx",
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            GeneratedAt = generatedAt,
            GeneratedBy = operatorName,
            FilterCriteria = filterCriteria,
            Summary = summary
        };

        return (excel, metadata, metadata.FileName);
    }

    private static string GenerateCsv<T>(List<T> rows)
    {
        using var writer = new StringWriter();
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Encoding = Encoding.UTF8
        };
        using var csv = new CsvWriter(writer, config);
        csv.WriteRecords(rows);
        return "\uFEFF" + writer.ToString();
    }

    private static byte[] GenerateExcel<T>(
        List<T> rows,
        string sheetName,
        string summary,
        Dictionary<string, object?> filterCriteria,
        string operatorName,
        DateTime generatedAt)
    {
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add(sheetName);

        ws.Cells["A1"].Value = "景区运营 - 导出报告";
        ws.Cells["A1"].Style.Font.Size = 16;
        ws.Cells["A1"].Style.Font.Bold = true;
        ws.Cells["A1:A2"].Merge = true;
        ws.Cells["A3"].Value = summary;
        ws.Cells["A3"].Style.Font.Bold = true;

        ws.Cells["A5"].Value = "筛选口径:";
        ws.Cells["A5"].Style.Font.Bold = true;
        var filterRow = 6;
        foreach (var kvp in filterCriteria)
        {
            ws.Cells[$"A{filterRow}"].Value = kvp.Key;
            ws.Cells[$"B{filterRow}"].Value = kvp.Value?.ToString() ?? "";
            filterRow++;
        }

        filterRow++;
        ws.Cells[$"A{filterRow}"].Value = $"生成时间:";
        ws.Cells[$"B{filterRow}"].Value = generatedAt.ToString("yyyy-MM-dd HH:mm:ss");
        filterRow++;
        ws.Cells[$"A{filterRow}"].Value = "操作者:";
        ws.Cells[$"B{filterRow}"].Value = operatorName;

        filterRow += 2;

        if (rows.Count > 0)
        {
            var firstRow = rows[0]!;
            var properties = firstRow.GetType().GetProperties();
            var col = 1;
            foreach (var prop in properties)
            {
                ws.Cells[filterRow, col].Value = prop.Name;
                ws.Cells[filterRow, col].Style.Font.Bold = true;
                col++;
            }
            filterRow++;
            var dataStartRow = filterRow;
            foreach (var row in rows)
            {
                col = 1;
                foreach (var prop in properties)
                {
                    var value = prop.GetValue(row);
                    ws.Cells[filterRow, col].Value = value?.ToString() ?? "";
                    col++;
                }
                filterRow++;
            }
            ws.Cells[$"A{dataStartRow - 1}:{GetExcelColumnName(properties.Length)}{dataStartRow + rows.Count - 1}"].AutoFitColumns();
        }

        return package.GetAsByteArray();
    }

    private static byte[] GenerateMonthlyExcel(
        List<object> overviewRows,
        List<object> dailyRows,
        List<object> spotRows,
        string summary,
        Dictionary<string, object?> filterCriteria,
        string operatorName,
        DateTime generatedAt,
        int year,
        int month)
    {
        using var package = new ExcelPackage();

        var wsOverview = package.Workbook.Worksheets.Add("总览");
        wsOverview.Cells["A1"].Value = $"{year}年{month}月 景区运营月度复盘报告";
        wsOverview.Cells["A1"].Style.Font.Size = 18;
        wsOverview.Cells["A1"].Style.Font.Bold = true;
        wsOverview.Cells["A1:B1"].Merge = true;
        wsOverview.Cells["A2"].Value = summary;
        wsOverview.Cells["A2"].Style.Font.Bold = true;

        wsOverview.Cells["A4"].Value = "筛选口径:";
        wsOverview.Cells["A4"].Style.Font.Bold = true;
        var filterRow = 5;
        foreach (var kvp in filterCriteria)
        {
            wsOverview.Cells[$"A{filterRow}"].Value = kvp.Key;
            wsOverview.Cells[$"B{filterRow}"].Value = kvp.Value?.ToString() ?? "";
            filterRow++;
        }
        wsOverview.Cells[$"A{filterRow}"].Value = $"生成时间:";
        wsOverview.Cells[$"B{filterRow}"].Value = generatedAt.ToString("yyyy-MM-dd HH:mm:ss");
        filterRow++;
        wsOverview.Cells[$"A{filterRow}"].Value = "操作者:";
        wsOverview.Cells[$"B{filterRow}"].Value = operatorName;

        filterRow += 2;
        wsOverview.Cells[$"A{filterRow}"].Value = "核心指标";
        wsOverview.Cells[$"A{filterRow}"].Style.Font.Bold = true;
        wsOverview.Cells[$"A{filterRow}"].Style.Font.Size = 14;
        wsOverview.Cells[$"A{filterRow}:B{filterRow}"].Merge = true;
        filterRow++;

        wsOverview.Cells[$"A{filterRow}"].Value = "指标";
        wsOverview.Cells[$"B{filterRow}"].Value = "数值";
        wsOverview.Cells[$"A{filterRow}:B{filterRow}"].Style.Font.Bold = true;
        filterRow++;

        var overviewStart = filterRow;
        foreach (var row in overviewRows)
        {
            var props = row.GetType().GetProperties();
            wsOverview.Cells[$"A{filterRow}"].Value = props[0].GetValue(row)?.ToString();
            wsOverview.Cells[$"B{filterRow}"].Value = props[1].GetValue(row)?.ToString();
            filterRow++;
        }
        wsOverview.Cells[$"A{overviewStart}:B{filterRow - 1}"].AutoFitColumns();

        var wsDaily = package.Workbook.Worksheets.Add("每日明细");
        wsDaily.Cells["A1"].Value = "每日到场情况";
        wsDaily.Cells["A1"].Style.Font.Bold = true;
        wsDaily.Cells["A1"].Style.Font.Size = 14;
        WriteDynamicTable(wsDaily, dailyRows, 3);

        var wsSpot = package.Workbook.Worksheets.Add("景区明细");
        wsSpot.Cells["A1"].Value = "各景区情况";
        wsSpot.Cells["A1"].Style.Font.Bold = true;
        wsSpot.Cells["A1"].Style.Font.Size = 14;
        WriteDynamicTable(wsSpot, spotRows, 3);

        return package.GetAsByteArray();
    }

    private static void WriteDynamicTable(ExcelWorksheet ws, List<object> rows, int startRow)
    {
        if (rows.Count == 0) return;
        var firstRow = rows[0]!;
        var properties = firstRow.GetType().GetProperties();
        var col = 1;
        foreach (var prop in properties)
        {
            ws.Cells[startRow, col].Value = prop.Name;
            ws.Cells[startRow, col].Style.Font.Bold = true;
            col++;
        }
        var rowNum = startRow + 1;
        foreach (var row in rows)
        {
            col = 1;
            foreach (var prop in properties)
            {
                var value = prop.GetValue(row);
                ws.Cells[rowNum, col].Value = value?.ToString() ?? "";
                col++;
            }
            rowNum++;
        }
        ws.Cells[$"A{startRow}:{GetExcelColumnName(properties.Length)}{rowNum - 1}"].AutoFitColumns();
    }

    private static string GetExcelColumnName(int columnNumber)
    {
        var dividend = columnNumber;
        var columnName = string.Empty;
        while (dividend > 0)
        {
            var modulo = (dividend - 1) % 26;
            columnName = Convert.ToChar(65 + modulo).ToString() + columnName;
            dividend = (dividend - modulo) / 26;
        }
        return columnName;
    }
}
