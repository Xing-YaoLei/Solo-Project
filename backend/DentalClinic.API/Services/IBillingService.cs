using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Services;

public interface IBillingService
{
    Task<IEnumerable<BillingRecordDto>> GetBillingRecordsAsync(
        int? patientId = null,
        BillingStatus? status = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20);

    Task<BillingRecordDto?> GetBillingRecordByIdAsync(int id);
    Task<BillingRecordDto> CreateBillingRecordAsync(CreateBillingRecordDto dto);
    Task<BillingRecordDto?> UpdateBillingRecordAsync(int id, UpdateBillingRecordDto dto);
    Task<bool> DeleteBillingRecordAsync(int id);
    Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<int> GetBillingRecordCountAsync(
        int? patientId = null,
        BillingStatus? status = null,
        DateTime? startDate = null,
        DateTime? endDate = null);
}
