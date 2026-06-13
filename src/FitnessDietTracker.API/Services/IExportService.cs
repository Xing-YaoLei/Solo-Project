using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IExportService
{
    Task<FileDownloadDto> ExportAsync(ExportRequestDto dto, int operatorId);
    Task<List<ExportRecordDto>> GetExportHistoryAsync(int? operatorId);
}
