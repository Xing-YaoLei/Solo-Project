using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public interface IAppointmentService
{
    Task<AppointmentDetailDto> GetByIdAsync(int id);
    Task<AppointmentDetailDto> GetDetailAsync(int id);
    Task<List<AppointmentListDto>> GetListAsync(AppointmentStatus? status, string? keyword);
    Task<PagedResultDto<AppointmentListDto>> GetPagedAsync(AppointmentQueryDto query);
    Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto);
    Task<AppointmentDto> UpdateAsync(int id, UpdateAppointmentDto dto);
    Task DeleteAsync(int id);
    Task<AppointmentDetailDto> ChangeStatusAsync(int id, ChangeStatusDto dto);
    Task<AppointmentDetailDto> CheckInAsync(int id);
    Task<AppointmentDetailDto> CompleteAsync(int id);
    Task<AppointmentDetailDto> CloseAsync(int id);
    Task<AppointmentDetailDto> ReopenAsync(int id);
    Task<PartsShortageRecordDto> AddPartsShortageAsync(int appointmentId, PartsShortageHandleDto dto);
    Task<List<PartsShortageRecordDto>> GetPartsShortagesAsync(int appointmentId);
    Task<AppointmentDetailDto> ResolvePartsShortageAsync(int appointmentId, int shortageId);
    Task<AppointmentDetailDto> SupplementDataAsync(int id, DataSupplementDto dto);
    Task<AppointmentDetailDto> RequestReviewAsync(int id, string? remarks);
    Task<AppointmentDetailDto> ProcessReviewAsync(int id, ReviewDto dto);
}
