using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Services;

public interface ITreatmentPlanService
{
    Task<IEnumerable<TreatmentPlanDto>> GetTreatmentPlansAsync(
        int? patientId = null,
        TreatmentStatus? status = null,
        int page = 1,
        int pageSize = 20);

    Task<TreatmentPlanDto?> GetTreatmentPlanByIdAsync(int id);
    Task<TreatmentPlanDto> CreateTreatmentPlanAsync(CreateTreatmentPlanDto dto);
    Task<TreatmentPlanDto?> UpdateTreatmentPlanAsync(int id, UpdateTreatmentPlanDto dto);
    Task<bool> DeleteTreatmentPlanAsync(int id);
    Task<bool> UpdatePlanItemStatusAsync(int planItemId, bool isCompleted);
    Task<int> GetTreatmentPlanCountAsync(int? patientId = null, TreatmentStatus? status = null);
}
