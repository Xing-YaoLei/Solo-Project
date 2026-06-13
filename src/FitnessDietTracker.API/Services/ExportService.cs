using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace FitnessDietTracker.API.Services;

public class ExportService : IExportService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public ExportService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<FileDownloadDto> ExportAsync(ExportRequestDto dto, int operatorId)
    {
        var filterCriteria = BuildFilterCriteria(dto);
        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        var fileName = $"{dto.ExportType}_{timestamp}.{(dto.Format == ExportFormat.Excel ? "xlsx" : "csv")}";

        byte[] fileBytes;
        string contentType;

        switch (dto.ExportType)
        {
            case "DietRecords":
                var records = await GetDietRecordsForExport(dto);
                fileBytes = dto.Format == ExportFormat.Excel
                    ? ExportDietRecordsExcel(records, filterCriteria, operatorId)
                    : ExportDietRecordsCsv(records, filterCriteria, operatorId);
                contentType = dto.Format == ExportFormat.Excel
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv";
                break;

            case "BodyMeasurements":
                var measurements = await GetBodyMeasurementsForExport(dto);
                fileBytes = dto.Format == ExportFormat.Excel
                    ? ExportBodyMeasurementsExcel(measurements, filterCriteria, operatorId)
                    : ExportBodyMeasurementsCsv(measurements, filterCriteria, operatorId);
                contentType = dto.Format == ExportFormat.Excel
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "text/csv";
                break;

            default:
                throw new NotSupportedException($"不支持的导出类型: {dto.ExportType}");
        }

        var exportFolder = _configuration["AppSettings:ExportFolderPath"] ?? "./Exports";
        if (!Directory.Exists(exportFolder))
            Directory.CreateDirectory(exportFolder);

        var fullPath = Path.Combine(exportFolder, fileName);
        await File.WriteAllBytesAsync(fullPath, fileBytes);

        var operatorUser = await _context.Users.FindAsync(operatorId);
        _context.ExportRecords.Add(new ExportRecord
        {
            Format = dto.Format,
            FileName = fileName,
            FilterCriteria = filterCriteria,
            GeneratedAt = DateTime.UtcNow,
            OperatorId = operatorId,
            FilePath = fullPath,
            FileSize = fileBytes.Length
        });
        await _context.SaveChangesAsync();

        return new FileDownloadDto
        {
            FileBytes = fileBytes,
            FileName = fileName,
            ContentType = contentType
        };
    }

    public async Task<List<ExportRecordDto>> GetExportHistoryAsync(int? operatorId)
    {
        var query = _context.ExportRecords
            .Include(e => e.Operator)
            .AsQueryable();

        if (operatorId.HasValue)
            query = query.Where(e => e.OperatorId == operatorId.Value);

        return await query
            .OrderByDescending(e => e.GeneratedAt)
            .Select(e => new ExportRecordDto
            {
                Id = e.Id,
                Format = e.Format,
                FileName = e.FileName,
                FilterCriteria = e.FilterCriteria,
                GeneratedAt = e.GeneratedAt,
                OperatorId = e.OperatorId,
                OperatorName = e.Operator.UserName,
                FileSize = e.FileSize
            })
            .ToListAsync();
    }

    private string BuildFilterCriteria(ExportRequestDto dto)
    {
        var parts = new List<string> { $"导出类型: {dto.ExportType}", $"格式: {dto.Format}" };

        if (dto.UserId.HasValue)
        {
            var user = _context.Users.Find(dto.UserId.Value);
            parts.Add($"用户: {user?.UserName ?? dto.UserId.Value.ToString()}");
        }
        if (dto.CoachId.HasValue)
        {
            var coach = _context.Users.Find(dto.CoachId.Value);
            parts.Add($"所属教练: {coach?.UserName ?? dto.CoachId.Value.ToString()}");
        }
        if (dto.StartDate.HasValue)
            parts.Add($"开始日期: {dto.StartDate.Value:yyyy-MM-dd}");
        if (dto.EndDate.HasValue)
            parts.Add($"结束日期: {dto.EndDate.Value:yyyy-MM-dd}");

        return string.Join("; ", parts);
    }

    private async Task<List<DietRecordExportRow>> GetDietRecordsForExport(ExportRequestDto dto)
    {
        var query = _context.DietRecords
            .Include(d => d.User)
            .Include(d => d.CoachComment).ThenInclude(c => c.Coach)
            .AsQueryable();

        if (dto.UserId.HasValue)
            query = query.Where(d => d.UserId == dto.UserId.Value);
        if (dto.CoachId.HasValue)
            query = query.Where(d => d.User.CoachId == dto.CoachId.Value);
        if (dto.StartDate.HasValue)
            query = query.Where(d => d.RecordDate >= dto.StartDate.Value);
        if (dto.EndDate.HasValue)
            query = query.Where(d => d.RecordDate <= dto.EndDate.Value);

        return await query
            .OrderBy(d => d.UserId).ThenBy(d => d.RecordDate)
            .Select(d => new DietRecordExportRow
            {
                UserName = d.User.UserName,
                RecordDate = d.RecordDate,
                MealType = d.MealType.ToString(),
                FoodItems = d.FoodItems,
                Calories = d.Calories,
                Protein = d.Protein,
                Carbs = d.Carbs,
                Fat = d.Fat,
                Notes = d.Notes,
                PhotoCount = d.Photos.Count,
                CoachName = d.CoachComment != null ? d.CoachComment.Coach.UserName : string.Empty,
                CoachComment = d.CoachComment != null ? d.CoachComment.Comment : string.Empty,
                CommentUpdatedAt = d.CoachComment != null ? d.CoachComment.UpdatedAt : null
            })
            .ToListAsync();
    }

    private async Task<List<BodyMeasurementExportRow>> GetBodyMeasurementsForExport(ExportRequestDto dto)
    {
        var query = _context.BodyMeasurements
            .Include(b => b.User)
            .AsQueryable();

        if (dto.UserId.HasValue)
            query = query.Where(b => b.UserId == dto.UserId.Value);
        if (dto.CoachId.HasValue)
            query = query.Where(b => b.User.CoachId == dto.CoachId.Value);
        if (dto.StartDate.HasValue)
            query = query.Where(b => b.MeasureDate >= dto.StartDate.Value);
        if (dto.EndDate.HasValue)
            query = query.Where(b => b.MeasureDate <= dto.EndDate.Value);

        return await query
            .OrderBy(b => b.UserId).ThenBy(b => b.MeasureDate)
            .Select(b => new BodyMeasurementExportRow
            {
                UserName = b.User.UserName,
                MeasureDate = b.MeasureDate,
                Weight = b.Weight,
                BodyFatPercentage = b.BodyFatPercentage,
                MuscleMass = b.MuscleMass,
                Bmi = b.Bmi,
                Waist = b.Waist,
                Hip = b.Hip,
                Chest = b.Chest,
                Biceps = b.Biceps,
                Thigh = b.Thigh,
                Notes = b.Notes
            })
            .ToListAsync();
    }

    private byte[] ExportDietRecordsCsv(List<DietRecordExportRow> records, string filterCriteria, int operatorId)
    {
        var operatorName = _context.Users.Find(operatorId)?.UserName ?? "Unknown";
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        writer.WriteLine($"# 筛选口径: {filterCriteria}");
        writer.WriteLine($"# 生成时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        writer.WriteLine($"# 操作者: {operatorName}");
        writer.WriteLine();

        var config = new CsvConfiguration(CultureInfo.InvariantCulture) { Delimiter = "," };
        using var csv = new CsvWriter(writer, config);
        csv.WriteRecords(records);
        writer.Flush();
        return ms.ToArray();
    }

    private byte[] ExportBodyMeasurementsCsv(List<BodyMeasurementExportRow> records, string filterCriteria, int operatorId)
    {
        var operatorName = _context.Users.Find(operatorId)?.UserName ?? "Unknown";
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        writer.WriteLine($"# 筛选口径: {filterCriteria}");
        writer.WriteLine($"# 生成时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        writer.WriteLine($"# 操作者: {operatorName}");
        writer.WriteLine();

        var config = new CsvConfiguration(CultureInfo.InvariantCulture) { Delimiter = "," };
        using var csv = new CsvWriter(writer, config);
        csv.WriteRecords(records);
        writer.Flush();
        return ms.ToArray();
    }

    private byte[] ExportDietRecordsExcel(List<DietRecordExportRow> records, string filterCriteria, int operatorId)
    {
        var operatorName = _context.Users.Find(operatorId)?.UserName ?? "Unknown";
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("饮食记录");

        ws.Cells["A1"].Value = "筛选口径";
        ws.Cells["B1"].Value = filterCriteria;
        ws.Cells["A2"].Value = "生成时间";
        ws.Cells["B2"].Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        ws.Cells["A3"].Value = "操作者";
        ws.Cells["B3"].Value = operatorName;

        ws.Cells[5, 1].LoadFromCollection(records, true);
        ws.Cells[ws.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }

    private byte[] ExportBodyMeasurementsExcel(List<BodyMeasurementExportRow> records, string filterCriteria, int operatorId)
    {
        var operatorName = _context.Users.Find(operatorId)?.UserName ?? "Unknown";
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("体测指标");

        ws.Cells["A1"].Value = "筛选口径";
        ws.Cells["B1"].Value = filterCriteria;
        ws.Cells["A2"].Value = "生成时间";
        ws.Cells["B2"].Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        ws.Cells["A3"].Value = "操作者";
        ws.Cells["B3"].Value = operatorName;

        ws.Cells[5, 1].LoadFromCollection(records, true);
        ws.Cells[ws.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }
}

public class DietRecordExportRow
{
    public string UserName { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } = string.Empty;
    public string FoodItems { get; set; } = string.Empty;
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public string? Notes { get; set; }
    public int PhotoCount { get; set; }
    public string CoachName { get; set; } = string.Empty;
    public string CoachComment { get; set; } = string.Empty;
    public DateTime? CommentUpdatedAt { get; set; }
}

public class BodyMeasurementExportRow
{
    public string UserName { get; set; } = string.Empty;
    public DateTime MeasureDate { get; set; }
    public decimal Weight { get; set; }
    public decimal BodyFatPercentage { get; set; }
    public decimal? MuscleMass { get; set; }
    public decimal? Bmi { get; set; }
    public decimal? Waist { get; set; }
    public decimal? Hip { get; set; }
    public decimal? Chest { get; set; }
    public decimal? Biceps { get; set; }
    public decimal? Thigh { get; set; }
    public string? Notes { get; set; }
}
