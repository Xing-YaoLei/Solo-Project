using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Services;

public interface IAppointmentService
{
    Task<IEnumerable<AppointmentListDto>> GetAppointmentsAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        AppointmentStatus? status = null,
        int? patientId = null,
        RiskLevel? riskLevel = null,
        int page = 1,
        int pageSize = 20);

    Task<AppointmentDetailDto?> GetAppointmentByIdAsync(int id);
    Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentDto dto);
    Task<AppointmentDto?> UpdateAppointmentAsync(int id, UpdateAppointmentDto dto);
    Task<bool> DeleteAppointmentAsync(int id);
    Task<bool> UpdateAppointmentStatusAsync(int id, AppointmentStatus status);
    Task<IEnumerable<NoShowAppointmentDto>> GetNoShowAppointmentsAsync(RiskLevel? minRiskLevel = null);
    Task<bool> UpdateCommunicationNotesAsync(int id, string notes);
    Task<bool> UpdateReviewCommentsAsync(int id, string comments);
    Task<int> GetAppointmentCountAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        AppointmentStatus? status = null,
        int? patientId = null,
        RiskLevel? riskLevel = null);
}
