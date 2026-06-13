using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Dtos;

public class ExportRequestDto
{
    public ExportFormat Format { get; set; }
    public int? UserId { get; set; }
    public int? CoachId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string ExportType { get; set; } = "DietRecords";
}

public class ExportRecordDto
{
    public int Id { get; set; }
    public ExportFormat Format { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilterCriteria { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public int OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public long FileSize { get; set; }
}

public class FileDownloadDto
{
    public byte[] FileBytes { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}
