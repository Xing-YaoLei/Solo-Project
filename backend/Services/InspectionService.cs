using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public class InspectionService : IInspectionService
{
    private readonly AppointmentDbContext _context;

    public InspectionService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<InspectionPhotoDto> GetByIdAsync(int id)
    {
        var photo = await _context.InspectionPhotos.FindAsync(id);
        if (photo == null)
            throw new KeyNotFoundException($"质检照片不存在: {id}");

        return MapToDto(photo);
    }

    public async Task<List<InspectionPhotoDto>> GetByAppointmentIdAsync(int appointmentId, PhotoType? photoType = null)
    {
        var query = _context.InspectionPhotos
            .Where(p => p.AppointmentId == appointmentId);

        if (photoType.HasValue)
            query = query.Where(p => p.PhotoType == photoType.Value);

        var photos = await query
            .OrderByDescending(p => p.UploadTime)
            .ToListAsync();

        return photos.Select(MapToDto).ToList();
    }

    public async Task<InspectionPhotoDto> UploadAsync(UploadPhotoDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(dto.AppointmentId);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {dto.AppointmentId}");

        var photo = new InspectionPhoto
        {
            AppointmentId = dto.AppointmentId,
            PhotoUrl = dto.PhotoUrl,
            PhotoType = dto.PhotoType,
            UploadTime = DateTime.Now,
            Remarks = dto.Remarks
        };

        _context.InspectionPhotos.Add(photo);
        await _context.SaveChangesAsync();

        return MapToDto(photo);
    }

    public async Task DeleteAsync(int id)
    {
        var photo = await _context.InspectionPhotos.FindAsync(id);
        if (photo == null)
            throw new KeyNotFoundException($"质检照片不存在: {id}");

        _context.InspectionPhotos.Remove(photo);
        await _context.SaveChangesAsync();
    }

    private static InspectionPhotoDto MapToDto(InspectionPhoto photo)
    {
        return new InspectionPhotoDto
        {
            Id = photo.Id,
            AppointmentId = photo.AppointmentId,
            PhotoUrl = photo.PhotoUrl,
            PhotoType = photo.PhotoType,
            UploadTime = photo.UploadTime,
            Remarks = photo.Remarks
        };
    }
}
