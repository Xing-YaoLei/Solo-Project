using AutoRepair.Application.DTOs;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Interfaces;

public interface IVehicleService
{
    Task<IEnumerable<VehicleDto>> GetAllAsync();
    Task<VehicleDto?> GetByIdAsync(Guid id);
    Task<VehicleDto?> GetByLicensePlateAsync(string licensePlate);
    Task<VehicleDto> CreateAsync(VehicleCreateDto dto);
    Task<VehicleDto?> UpdateAsync(Guid id, VehicleUpdateDto dto);
    Task<bool> DeleteAsync(Guid id);
}

public interface IWorkOrderService
{
    Task<IEnumerable<WorkOrderDto>> GetAllAsync(string? userId = null, DateTime? date = null);
    Task<IEnumerable<WorkOrderDto>> GetDailyScheduleAsync(DateTime date, string? userId = null);
    Task<WorkOrderDto?> GetByIdAsync(Guid id);
    Task<WorkOrderDto> CreateAsync(WorkOrderCreateDto dto, string createdByUserId);
    Task<WorkOrderDto?> UpdateAsync(Guid id, WorkOrderUpdateDto dto);
    Task<WorkOrderDto?> UpdateStatusAsync(Guid id, WorkOrderStatus status);
    Task<bool> DeleteAsync(Guid id);
}

public interface IDiagnosisService
{
    Task<IEnumerable<DiagnosisDto>> GetAllAsync(Guid? vehicleId = null, Guid? workOrderId = null);
    Task<DiagnosisDto?> GetByIdAsync(Guid id);
    Task<DiagnosisDto> CreateAsync(DiagnosisCreateDto dto, string createdByUserId);
    Task<bool> DeleteAsync(Guid id);
}

public interface IPartService
{
    Task<IEnumerable<PartDto>> GetAllAsync(string? category = null, bool? lowStockOnly = null);
    Task<PartDto?> GetByIdAsync(Guid id);
    Task<PartDto> CreateAsync(PartCreateDto dto);
    Task<PartDto?> UpdateAsync(Guid id, PartUpdateDto dto);
    Task<PartDto?> UpdateStockAsync(Guid id, int quantityChange);
    Task<bool> DeleteAsync(Guid id);
}

public interface IStockAlertService
{
    Task<IEnumerable<StockAlertDto>> GetAllAsync(bool? acknowledged = null);
    Task<StockAlertDto?> GetByIdAsync(Guid id);
    Task AcknowledgeAsync(Guid id, string userId);
    Task CheckStockLevelsAndGenerateAlertsAsync();
}

public interface IQuoteService
{
    Task<IEnumerable<QuoteDto>> GetAllAsync(Guid? workOrderId = null);
    Task<QuoteDto?> GetByIdAsync(Guid id);
    Task<QuoteDto> CreateAsync(QuoteCreateDto dto, string createdByUserId);
    Task<QuoteDto?> UpdateStatusAsync(Guid id, QuoteStatus status);
    Task<bool> DeleteAsync(Guid id);
}

public interface IReviewOpinionService
{
    Task<ReviewOpinionDto> AddAsync(ReviewOpinionCreateDto dto, string reviewerUserId);
}

public interface ICommunicationLogService
{
    Task<IEnumerable<CommunicationLogDto>> GetByEntityAsync(Guid? stockAlertId = null, Guid? quoteId = null, Guid? workOrderId = null);
    Task<CommunicationLogDto> CreateAsync(CommunicationLogCreateDto dto, string fromUserId);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<ReworkRateDto>> GetReworkTrendAsync(int months = 6);
}

public interface IAuthService
{
    Task<UserDto?> LoginAsync(LoginDto dto);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<IEnumerable<UserDto>> GetAllTechniciansAsync();
}
