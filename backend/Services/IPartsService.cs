using CarServiceAppointment.API.DTOs;

namespace CarServiceAppointment.API.Services;

public interface IPartsService
{
    Task<PartsDto> GetByIdAsync(int id);
    Task<List<PartsDto>> GetAllAsync();
    Task<PagedResultDto<PartsDto>> GetPagedAsync(int pageIndex, int pageSize, string? keyword = null);
    Task<List<PartsDto>> GetLowStockAsync();
    Task<PartsDto> CreateAsync(CreatePartsDto dto);
    Task<PartsDto> UpdateAsync(int id, UpdatePartsDto dto);
    Task DeleteAsync(int id);
    Task<PartsDto> AddStockAsync(int id, UpdateStockDto dto);
    Task<PartsDto> ReduceStockAsync(int id, UpdateStockDto dto);
    Task<List<PartsShortageRecordDto>> GetAllShortageRecordsAsync();
}
