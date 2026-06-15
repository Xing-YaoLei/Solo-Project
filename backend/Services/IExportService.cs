using CertSchedulePlatform.DTOs;

namespace CertSchedulePlatform.Services;

public interface IExportService
{
    Task<ExportRecordDto> ExportLearningProgressAsync(ExportRequestDto request);
    Task<ExportRecordDto> ExportMonthlyReviewAsync(ExportRequestDto request);
    Task<ExportRecordDto> ExportAssignmentRecordsAsync(ExportRequestDto request);
    Task<ExportRecordDto> ExportAlertsAsync(ExportRequestDto request);
    Task<byte[]> DownloadExportAsync(int exportId);
    Task<PagedResult<ExportRecordDto>> GetExportHistoryAsync(int pageIndex, int pageSize, ExportType? type = null);
}
