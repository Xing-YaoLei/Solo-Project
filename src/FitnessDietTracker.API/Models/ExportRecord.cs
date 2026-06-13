using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Models;

public class ExportRecord
{
    public int Id { get; set; }
    public ExportFormat Format { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilterCriteria { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int OperatorId { get; set; }
    public User Operator { get; set; } = null!;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
}
