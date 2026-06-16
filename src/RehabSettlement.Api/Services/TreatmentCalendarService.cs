using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Services;

public interface ITreatmentCalendarService
{
    Task<List<TreatmentCalendarDto>> GetByBillIdAsync(int billId);
    Task<List<TreatmentCalendarDto>> GetByPatientIdAsync(int patientId, DateOnly? startDate, DateOnly? endDate);
    Task<TreatmentCalendarDto?> GetByIdAsync(int id);
    Task<TreatmentCalendarDto> CreateAsync(CreateTreatmentCalendarDto dto);
    Task<TreatmentCalendarDto?> UpdateAsync(int id, UpdateTreatmentCalendarDto dto);
    Task<bool> DeleteAsync(int id);
}

public class TreatmentCalendarService : ITreatmentCalendarService
{
    private readonly AppDbContext _context;

    public TreatmentCalendarService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TreatmentCalendarDto>> GetByBillIdAsync(int billId)
    {
        return await _context.TreatmentCalendars
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.Therapist)
            .Where(t => t.BillId == billId)
            .OrderBy(t => t.TreatmentDate)
            .ThenBy(t => t.StartTime)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<List<TreatmentCalendarDto>> GetByPatientIdAsync(int patientId, DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.TreatmentCalendars
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.Therapist)
            .Where(t => t.PatientId == patientId);

        if (startDate.HasValue)
            query = query.Where(t => t.TreatmentDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(t => t.TreatmentDate <= endDate.Value);

        return await query
            .OrderBy(t => t.TreatmentDate)
            .ThenBy(t => t.StartTime)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<TreatmentCalendarDto?> GetByIdAsync(int id)
    {
        var treatment = await _context.TreatmentCalendars
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.Therapist)
            .FirstOrDefaultAsync(t => t.Id == id);

        return treatment == null ? null : MapToDto(treatment);
    }

    public async Task<TreatmentCalendarDto> CreateAsync(CreateTreatmentCalendarDto dto)
    {
        var treatment = new TreatmentCalendar
        {
            BillId = dto.BillId,
            PatientId = dto.PatientId,
            TreatmentDate = dto.TreatmentDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            TreatmentType = dto.TreatmentType,
            TreatmentItem = dto.TreatmentItem,
            DoctorId = dto.DoctorId,
            TherapistId = dto.TherapistId,
            StatusId = (int)Enums.TreatmentStatus.Scheduled,
            Duration = dto.Duration,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.TreatmentCalendars.Add(treatment);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(treatment.Id) ?? MapToDto(treatment);
    }

    public async Task<TreatmentCalendarDto?> UpdateAsync(int id, UpdateTreatmentCalendarDto dto)
    {
        var treatment = await _context.TreatmentCalendars.FindAsync(id);
        if (treatment == null) return null;

        if (dto.TreatmentDate.HasValue)
            treatment.TreatmentDate = dto.TreatmentDate.Value;
        if (dto.StartTime.HasValue)
            treatment.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue)
            treatment.EndTime = dto.EndTime.Value;
        if (dto.TreatmentType != null)
            treatment.TreatmentType = dto.TreatmentType;
        if (dto.TreatmentItem != null)
            treatment.TreatmentItem = dto.TreatmentItem;
        if (dto.DoctorId.HasValue)
            treatment.DoctorId = dto.DoctorId.Value;
        if (dto.TherapistId.HasValue)
            treatment.TherapistId = dto.TherapistId.Value;
        if (dto.StatusId.HasValue)
            treatment.StatusId = dto.StatusId.Value;
        if (dto.Duration.HasValue)
            treatment.Duration = dto.Duration.Value;
        if (dto.Remark != null)
            treatment.Remark = dto.Remark;

        treatment.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var treatment = await _context.TreatmentCalendars.FindAsync(id);
        if (treatment == null) return false;

        _context.TreatmentCalendars.Remove(treatment);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TreatmentCalendarDto MapToDto(TreatmentCalendar t)
    {
        return new TreatmentCalendarDto
        {
            Id = t.Id,
            BillId = t.BillId,
            PatientId = t.PatientId,
            PatientName = t.Patient?.Name ?? "",
            TreatmentDate = t.TreatmentDate,
            StartTime = t.StartTime,
            EndTime = t.EndTime,
            TreatmentType = t.TreatmentType,
            TreatmentItem = t.TreatmentItem,
            DoctorId = t.DoctorId,
            DoctorName = t.Doctor?.RealName,
            TherapistId = t.TherapistId,
            TherapistName = t.Therapist?.RealName,
            StatusId = t.StatusId,
            StatusName = GetStatusName(t.StatusId),
            Duration = t.Duration,
            Remark = t.Remark,
            CreatedAt = t.CreatedAt
        };
    }

    private static string GetStatusName(int statusId)
    {
        return statusId switch
        {
            1 => "已预约",
            2 => "进行中",
            3 => "已完成",
            4 => "已取消",
            5 => "未到",
            _ => "未知"
        };
    }
}
