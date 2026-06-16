using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class MedicationService : IMedicationService
{
    private readonly AppDbContext _context;

    public MedicationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MedicationDictDto>> GetAllMedicationsAsync()
    {
        return await _context.MedicationDictionaries
            .Select(m => new MedicationDictDto
            {
                Id = m.Id,
                MedicineName = m.MedicineName,
                GenericName = m.GenericName,
                DosageForm = m.DosageForm,
                DefaultDosage = m.DefaultDosage,
                Unit = m.Unit,
                Frequency = m.Frequency,
                Category = m.Category,
                SideEffects = m.SideEffects,
                Contraindications = m.Contraindications,
                IsActive = m.IsActive
            })
            .ToListAsync();
    }

    public async Task<MedicationDictDto?> GetMedicationByIdAsync(int id)
    {
        return await _context.MedicationDictionaries
            .Where(m => m.Id == id)
            .Select(m => new MedicationDictDto
            {
                Id = m.Id,
                MedicineName = m.MedicineName,
                GenericName = m.GenericName,
                DosageForm = m.DosageForm,
                DefaultDosage = m.DefaultDosage,
                Unit = m.Unit,
                Frequency = m.Frequency,
                Category = m.Category,
                SideEffects = m.SideEffects,
                Contraindications = m.Contraindications,
                IsActive = m.IsActive
            })
            .FirstOrDefaultAsync();
    }

    public async Task<MedicationDictDto> CreateMedicationAsync(CreateMedicationDictDto dto)
    {
        var entity = new MedicationDictionary
        {
            MedicineName = dto.MedicineName,
            GenericName = dto.GenericName,
            DosageForm = dto.DosageForm,
            DefaultDosage = dto.DefaultDosage,
            Unit = dto.Unit,
            Frequency = dto.Frequency,
            Category = dto.Category,
            SideEffects = dto.SideEffects,
            Contraindications = dto.Contraindications,
            IsActive = dto.IsActive
        };
        _context.MedicationDictionaries.Add(entity);
        await _context.SaveChangesAsync();
        return await GetMedicationByIdAsync(entity.Id) ?? throw new InvalidOperationException();
    }

    public async Task<MedicationDictDto?> UpdateMedicationAsync(int id, UpdateMedicationDictDto dto)
    {
        var entity = await _context.MedicationDictionaries.FindAsync(id);
        if (entity == null) return null;
        entity.MedicineName = dto.MedicineName;
        entity.GenericName = dto.GenericName;
        entity.DosageForm = dto.DosageForm;
        entity.DefaultDosage = dto.DefaultDosage;
        entity.Unit = dto.Unit;
        entity.Frequency = dto.Frequency;
        entity.Category = dto.Category;
        entity.SideEffects = dto.SideEffects;
        entity.Contraindications = dto.Contraindications;
        entity.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();
        return await GetMedicationByIdAsync(id);
    }

    public async Task<bool> DeleteMedicationAsync(int id)
    {
        var entity = await _context.MedicationDictionaries.FindAsync(id);
        if (entity == null) return false;
        _context.MedicationDictionaries.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ScheduleDto>> GetAllSchedulesAsync()
    {
        return await _context.MedicationSchedules
            .Include(s => s.Elderly)
            .Include(s => s.MedicationDict)
            .Include(s => s.CreatedByStaff)
            .Select(s => new ScheduleDto
            {
                Id = s.Id,
                ElderlyId = s.ElderlyId,
                ElderlyName = s.Elderly.Name,
                MedicationDictId = s.MedicationDictId,
                MedicineName = s.MedicationDict.MedicineName,
                Dosage = s.Dosage,
                Frequency = s.Frequency,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                TimeOfDay = s.TimeOfDay,
                Instructions = s.Instructions,
                Status = s.Status.ToString(),
                CreatedByStaffId = s.CreatedByStaffId,
                CreatedByStaffName = s.CreatedByStaff.Name
            })
            .ToListAsync();
    }

    public async Task<ScheduleDto?> GetScheduleByIdAsync(int id)
    {
        return await _context.MedicationSchedules
            .Include(s => s.Elderly)
            .Include(s => s.MedicationDict)
            .Include(s => s.CreatedByStaff)
            .Where(s => s.Id == id)
            .Select(s => new ScheduleDto
            {
                Id = s.Id,
                ElderlyId = s.ElderlyId,
                ElderlyName = s.Elderly.Name,
                MedicationDictId = s.MedicationDictId,
                MedicineName = s.MedicationDict.MedicineName,
                Dosage = s.Dosage,
                Frequency = s.Frequency,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                TimeOfDay = s.TimeOfDay,
                Instructions = s.Instructions,
                Status = s.Status.ToString(),
                CreatedByStaffId = s.CreatedByStaffId,
                CreatedByStaffName = s.CreatedByStaff.Name
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ScheduleDto> CreateScheduleAsync(CreateScheduleDto dto)
    {
        var entity = new MedicationSchedule
        {
            ElderlyId = dto.ElderlyId,
            MedicationDictId = dto.MedicationDictId,
            Dosage = dto.Dosage,
            Frequency = dto.Frequency,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            TimeOfDay = dto.TimeOfDay,
            Instructions = dto.Instructions,
            Status = MedicationStatus.Active,
            CreatedByStaffId = dto.CreatedByStaffId
        };
        _context.MedicationSchedules.Add(entity);
        await _context.SaveChangesAsync();
        return await GetScheduleByIdAsync(entity.Id) ?? throw new InvalidOperationException();
    }

    public async Task<ScheduleDto?> UpdateScheduleAsync(int id, UpdateScheduleDto dto)
    {
        var entity = await _context.MedicationSchedules.FindAsync(id);
        if (entity == null) return null;
        entity.Dosage = dto.Dosage;
        entity.Frequency = dto.Frequency;
        entity.StartTime = dto.StartTime;
        entity.EndTime = dto.EndTime;
        entity.TimeOfDay = dto.TimeOfDay;
        entity.Instructions = dto.Instructions;
        entity.Status = dto.Status;
        await _context.SaveChangesAsync();
        return await GetScheduleByIdAsync(id);
    }

    public async Task<IEnumerable<ScheduleDto>> GetSchedulesByElderlyAsync(int elderlyId)
    {
        return await _context.MedicationSchedules
            .Include(s => s.Elderly)
            .Include(s => s.MedicationDict)
            .Include(s => s.CreatedByStaff)
            .Where(s => s.ElderlyId == elderlyId)
            .Select(s => new ScheduleDto
            {
                Id = s.Id,
                ElderlyId = s.ElderlyId,
                ElderlyName = s.Elderly.Name,
                MedicationDictId = s.MedicationDictId,
                MedicineName = s.MedicationDict.MedicineName,
                Dosage = s.Dosage,
                Frequency = s.Frequency,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                TimeOfDay = s.TimeOfDay,
                Instructions = s.Instructions,
                Status = s.Status.ToString(),
                CreatedByStaffId = s.CreatedByStaffId,
                CreatedByStaffName = s.CreatedByStaff.Name
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<ReminderLogDto>> GetReminderLogsAsync(int? elderlyId = null, int? scheduleId = null)
    {
        var query = _context.MedicationReminderLogs
            .Include(r => r.Elderly)
            .Include(r => r.AcknowledgedByStaff)
            .AsQueryable();

        if (elderlyId.HasValue)
            query = query.Where(r => r.ElderlyId == elderlyId.Value);
        if (scheduleId.HasValue)
            query = query.Where(r => r.ScheduleId == scheduleId.Value);

        return await query
            .OrderByDescending(r => r.ReminderTime)
            .Select(r => new ReminderLogDto
            {
                Id = r.Id,
                ScheduleId = r.ScheduleId,
                ElderlyId = r.ElderlyId,
                ElderlyName = r.Elderly.Name,
                ReminderTime = r.ReminderTime,
                Status = r.Status,
                AcknowledgedAt = r.AcknowledgedAt,
                AcknowledgedByStaffId = r.AcknowledgedByStaffId,
                AcknowledgedByStaffName = r.AcknowledgedByStaff != null ? r.AcknowledgedByStaff.Name : null,
                Notes = r.Notes
            })
            .ToListAsync();
    }

    public async Task<ReminderLogDto> CreateReminderLogAsync(int scheduleId, int elderlyId, DateTime reminderTime)
    {
        var entity = new MedicationReminderLog
        {
            ScheduleId = scheduleId,
            ElderlyId = elderlyId,
            ReminderTime = reminderTime,
            Status = ReminderStatus.Pending
        };
        _context.MedicationReminderLogs.Add(entity);
        await _context.SaveChangesAsync();

        var log = await _context.MedicationReminderLogs
            .Include(r => r.Elderly)
            .Include(r => r.AcknowledgedByStaff)
            .FirstAsync(r => r.Id == entity.Id);

        return new ReminderLogDto
        {
            Id = log.Id,
            ScheduleId = log.ScheduleId,
            ElderlyId = log.ElderlyId,
            ElderlyName = log.Elderly.Name,
            ReminderTime = log.ReminderTime,
            Status = log.Status.ToString(),
            AcknowledgedAt = log.AcknowledgedAt,
            AcknowledgedByStaffId = log.AcknowledgedByStaffId,
            AcknowledgedByStaffName = log.AcknowledgedByStaff != null ? log.AcknowledgedByStaff.Name : null,
            Notes = log.Notes
        };
    }

    public async Task<ReminderLogDto?> AcknowledgeReminderAsync(int logId, AcknowledgeReminderDto dto)
    {
        var entity = await _context.MedicationReminderLogs.FindAsync(logId);
        if (entity == null) return null;
        entity.Status = ReminderStatus.Acknowledged;
        entity.AcknowledgedAt = DateTime.UtcNow;
        entity.AcknowledgedByStaffId = dto.AcknowledgedByStaffId;
        entity.Notes = dto.Notes;
        await _context.SaveChangesAsync();

        var log = await _context.MedicationReminderLogs
            .Include(r => r.Elderly)
            .Include(r => r.AcknowledgedByStaff)
            .FirstAsync(r => r.Id == logId);

        return new ReminderLogDto
        {
            Id = log.Id,
            ScheduleId = log.ScheduleId,
            ElderlyId = log.ElderlyId,
            ElderlyName = log.Elderly.Name,
            ReminderTime = log.ReminderTime,
            Status = log.Status.ToString(),
            AcknowledgedAt = log.AcknowledgedAt,
            AcknowledgedByStaffId = log.AcknowledgedByStaffId,
            AcknowledgedByStaffName = log.AcknowledgedByStaff != null ? log.AcknowledgedByStaff.Name : null,
            Notes = log.Notes
        };
    }
}
