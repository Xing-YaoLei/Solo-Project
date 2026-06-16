using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Services;

public interface INursingLogService
{
    Task<List<NursingLogDto>> GetByBillIdAsync(int billId);
    Task<List<NursingLogDto>> GetByPatientIdAsync(int patientId);
    Task<NursingLogDto?> GetByIdAsync(int id);
    Task<NursingLogDto> CreateAsync(CreateNursingLogDto dto);
    Task<NursingLogDto?> UpdateAsync(int id, CreateNursingLogDto dto);
    Task<bool> DeleteAsync(int id);
}

public class NursingLogService : INursingLogService
{
    private readonly AppDbContext _context;

    public NursingLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NursingLogDto>> GetByBillIdAsync(int billId)
    {
        return await _context.NursingLogs
            .Include(n => n.Patient)
            .Include(n => n.Nurse)
            .Where(n => n.BillId == billId)
            .OrderByDescending(n => n.LogDate)
            .ThenByDescending(n => n.LogTime)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<List<NursingLogDto>> GetByPatientIdAsync(int patientId)
    {
        return await _context.NursingLogs
            .Include(n => n.Patient)
            .Include(n => n.Nurse)
            .Where(n => n.PatientId == patientId)
            .OrderByDescending(n => n.LogDate)
            .ThenByDescending(n => n.LogTime)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    public async Task<NursingLogDto?> GetByIdAsync(int id)
    {
        var log = await _context.NursingLogs
            .Include(n => n.Patient)
            .Include(n => n.Nurse)
            .FirstOrDefaultAsync(n => n.Id == id);

        return log == null ? null : MapToDto(log);
    }

    public async Task<NursingLogDto> CreateAsync(CreateNursingLogDto dto)
    {
        var log = new NursingLog
        {
            BillId = dto.BillId,
            PatientId = dto.PatientId,
            TreatmentCalendarId = dto.TreatmentCalendarId,
            LogDate = dto.LogDate,
            LogTime = dto.LogTime,
            NurseId = dto.NurseId,
            VitalSigns = dto.VitalSigns,
            NursingContent = dto.NursingContent,
            PatientCondition = dto.PatientCondition,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.NursingLogs.Add(log);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(log.Id) ?? MapToDto(log);
    }

    public async Task<NursingLogDto?> UpdateAsync(int id, CreateNursingLogDto dto)
    {
        var log = await _context.NursingLogs.FindAsync(id);
        if (log == null) return null;

        log.BillId = dto.BillId ?? log.BillId;
        log.PatientId = dto.PatientId;
        log.TreatmentCalendarId = dto.TreatmentCalendarId ?? log.TreatmentCalendarId;
        log.LogDate = dto.LogDate;
        log.LogTime = dto.LogTime;
        log.NurseId = dto.NurseId;
        log.VitalSigns = dto.VitalSigns;
        log.NursingContent = dto.NursingContent;
        log.PatientCondition = dto.PatientCondition;
        log.Remark = dto.Remark;
        log.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var log = await _context.NursingLogs.FindAsync(id);
        if (log == null) return false;

        _context.NursingLogs.Remove(log);
        await _context.SaveChangesAsync();
        return true;
    }

    private static NursingLogDto MapToDto(NursingLog n)
    {
        return new NursingLogDto
        {
            Id = n.Id,
            BillId = n.BillId,
            PatientId = n.PatientId,
            PatientName = n.Patient?.Name ?? "",
            TreatmentCalendarId = n.TreatmentCalendarId,
            LogDate = n.LogDate,
            LogTime = n.LogTime,
            NurseId = n.NurseId,
            NurseName = n.Nurse?.RealName,
            VitalSigns = n.VitalSigns,
            NursingContent = n.NursingContent,
            PatientCondition = n.PatientCondition,
            Remark = n.Remark,
            CreatedAt = n.CreatedAt
        };
    }
}
