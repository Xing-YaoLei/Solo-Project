using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public interface IInspectionService
{
    Task<InspectionPhotoDto> GetByIdAsync(int id);
    Task<List<InspectionPhotoDto>> GetByAppointmentIdAsync(int appointmentId, PhotoType? photoType = null);
    Task<InspectionPhotoDto> UploadAsync(UploadPhotoDto dto);
    Task DeleteAsync(int id);
}
