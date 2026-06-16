using DentalClinic.API.DTOs;

namespace DentalClinic.API.Services;

public interface IImageAttachmentService
{
    Task<IEnumerable<ImageAttachmentDto>> GetImagesAsync(
        int? patientId = null,
        int? appointmentId = null,
        int? treatmentPlanId = null,
        string? category = null,
        int page = 1,
        int pageSize = 20);

    Task<ImageAttachmentDto?> GetImageByIdAsync(int id);
    Task<ImageAttachmentDto> UploadImageAsync(UploadImageDto dto, string fileName, string filePath, long fileSize, string fileType);
    Task<bool> DeleteImageAsync(int id);
    Task<int> GetImageCountAsync(
        int? patientId = null,
        int? appointmentId = null,
        int? treatmentPlanId = null,
        string? category = null);
}
