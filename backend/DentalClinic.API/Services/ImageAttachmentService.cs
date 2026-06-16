using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class ImageAttachmentService : IImageAttachmentService
{
    private readonly ApplicationDbContext _context;

    public ImageAttachmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ImageAttachmentDto>> GetImagesAsync(
        int? patientId = null,
        int? appointmentId = null,
        int? treatmentPlanId = null,
        string? category = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.ImageAttachments
            .Include(i => i.Patient)
            .AsQueryable();

        if (patientId.HasValue)
            query = query.Where(i => i.PatientId == patientId.Value);

        if (appointmentId.HasValue)
            query = query.Where(i => i.AppointmentId == appointmentId.Value);

        if (treatmentPlanId.HasValue)
            query = query.Where(i => i.TreatmentPlanId == treatmentPlanId.Value);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category == category);

        return await query
            .OrderByDescending(i => i.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new ImageAttachmentDto
            {
                Id = i.Id,
                PatientId = i.PatientId,
                PatientName = i.Patient!.Name,
                AppointmentId = i.AppointmentId,
                TreatmentPlanId = i.TreatmentPlanId,
                FileName = i.FileName,
                FilePath = i.FilePath,
                FileType = i.FileType,
                FileSize = i.FileSize,
                Description = i.Description,
                Category = i.Category,
                UploadedAt = i.UploadedAt,
                UploadedBy = i.UploadedBy
            })
            .ToListAsync();
    }

    public async Task<ImageAttachmentDto?> GetImageByIdAsync(int id)
    {
        var image = await _context.ImageAttachments
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (image == null) return null;

        return new ImageAttachmentDto
        {
            Id = image.Id,
            PatientId = image.PatientId,
            PatientName = image.Patient!.Name,
            AppointmentId = image.AppointmentId,
            TreatmentPlanId = image.TreatmentPlanId,
            FileName = image.FileName,
            FilePath = image.FilePath,
            FileType = image.FileType,
            FileSize = image.FileSize,
            Description = image.Description,
            Category = image.Category,
            UploadedAt = image.UploadedAt,
            UploadedBy = image.UploadedBy
        };
    }

    public async Task<ImageAttachmentDto> UploadImageAsync(
        UploadImageDto dto,
        string fileName,
        string filePath,
        long fileSize,
        string fileType)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);

        var image = new ImageAttachment
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            TreatmentPlanId = dto.TreatmentPlanId,
            FileName = fileName,
            FilePath = filePath,
            FileType = fileType,
            FileSize = fileSize,
            Description = dto.Description,
            Category = dto.Category,
            UploadedAt = DateTime.Now,
            UploadedBy = dto.UploadedBy
        };

        _context.ImageAttachments.Add(image);
        await _context.SaveChangesAsync();

        return new ImageAttachmentDto
        {
            Id = image.Id,
            PatientId = image.PatientId,
            PatientName = patient?.Name ?? "",
            AppointmentId = image.AppointmentId,
            TreatmentPlanId = image.TreatmentPlanId,
            FileName = image.FileName,
            FilePath = image.FilePath,
            FileType = image.FileType,
            FileSize = image.FileSize,
            Description = image.Description,
            Category = image.Category,
            UploadedAt = image.UploadedAt,
            UploadedBy = image.UploadedBy
        };
    }

    public async Task<bool> DeleteImageAsync(int id)
    {
        var image = await _context.ImageAttachments.FindAsync(id);
        if (image == null) return false;

        _context.ImageAttachments.Remove(image);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetImageCountAsync(
        int? patientId = null,
        int? appointmentId = null,
        int? treatmentPlanId = null,
        string? category = null)
    {
        var query = _context.ImageAttachments.AsQueryable();

        if (patientId.HasValue)
            query = query.Where(i => i.PatientId == patientId.Value);

        if (appointmentId.HasValue)
            query = query.Where(i => i.AppointmentId == appointmentId.Value);

        if (treatmentPlanId.HasValue)
            query = query.Where(i => i.TreatmentPlanId == treatmentPlanId.Value);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category == category);

        return await query.CountAsync();
    }
}
