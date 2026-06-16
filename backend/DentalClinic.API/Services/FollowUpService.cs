using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class FollowUpService : IFollowUpService
{
    private readonly ApplicationDbContext _context;

    public FollowUpService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<FollowUpTaskDto>> GetFollowUpTasksAsync(
        FollowUpStatus? status = null,
        FollowUpType? type = null,
        int? patientId = null,
        int? appointmentId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.FollowUpTasks
            .Include(f => f.Patient)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(f => f.Status == status.Value);

        if (type.HasValue)
            query = query.Where(f => f.Type == type.Value);

        if (patientId.HasValue)
            query = query.Where(f => f.PatientId == patientId.Value);

        if (appointmentId.HasValue)
            query = query.Where(f => f.AppointmentId == appointmentId.Value);

        if (startDate.HasValue)
            query = query.Where(f => f.ScheduledDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(f => f.ScheduledDate <= endDate.Value);

        return await query
            .OrderBy(f => f.ScheduledDate ?? f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FollowUpTaskDto
            {
                Id = f.Id,
                PatientId = f.PatientId,
                PatientName = f.Patient!.Name,
                PatientPhone = f.Patient.Phone,
                AppointmentId = f.AppointmentId,
                TreatmentPlanId = f.TreatmentPlanId,
                Type = f.Type,
                Status = f.Status,
                Title = f.Title,
                Content = f.Content,
                Result = f.Result,
                ScheduledDate = f.ScheduledDate,
                CompletedAt = f.CompletedAt,
                AssignedTo = f.AssignedTo,
                CompletedBy = f.CompletedBy,
                Remarks = f.Remarks,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<FollowUpTaskDto?> GetFollowUpTaskByIdAsync(int id)
    {
        var task = await _context.FollowUpTasks
            .Include(f => f.Patient)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (task == null) return null;

        return new FollowUpTaskDto
        {
            Id = task.Id,
            PatientId = task.PatientId,
            PatientName = task.Patient!.Name,
            PatientPhone = task.Patient.Phone,
            AppointmentId = task.AppointmentId,
            TreatmentPlanId = task.TreatmentPlanId,
            Type = task.Type,
            Status = task.Status,
            Title = task.Title,
            Content = task.Content,
            Result = task.Result,
            ScheduledDate = task.ScheduledDate,
            CompletedAt = task.CompletedAt,
            AssignedTo = task.AssignedTo,
            CompletedBy = task.CompletedBy,
            Remarks = task.Remarks,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<FollowUpTaskDto> CreateFollowUpTaskAsync(CreateFollowUpTaskDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);

        var task = new FollowUpTask
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            TreatmentPlanId = dto.TreatmentPlanId,
            Type = dto.Type,
            Status = FollowUpStatus.Pending,
            Title = dto.Title,
            Content = dto.Content,
            ScheduledDate = dto.ScheduledDate,
            AssignedTo = dto.AssignedTo,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now
        };

        _context.FollowUpTasks.Add(task);
        await _context.SaveChangesAsync();

        return new FollowUpTaskDto
        {
            Id = task.Id,
            PatientId = task.PatientId,
            PatientName = patient?.Name ?? "",
            PatientPhone = patient?.Phone,
            AppointmentId = task.AppointmentId,
            TreatmentPlanId = task.TreatmentPlanId,
            Type = task.Type,
            Status = task.Status,
            Title = task.Title,
            Content = task.Content,
            ScheduledDate = task.ScheduledDate,
            AssignedTo = task.AssignedTo,
            Remarks = task.Remarks,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<FollowUpTaskDto?> UpdateFollowUpTaskAsync(int id, UpdateFollowUpTaskDto dto)
    {
        var task = await _context.FollowUpTasks
            .Include(f => f.Patient)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (task == null) return null;

        if (dto.Status.HasValue) task.Status = dto.Status.Value;
        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Content != null) task.Content = dto.Content;
        if (dto.Result != null) task.Result = dto.Result;
        if (dto.ScheduledDate.HasValue) task.ScheduledDate = dto.ScheduledDate.Value;
        if (dto.CompletedAt.HasValue) task.CompletedAt = dto.CompletedAt.Value;
        if (dto.AssignedTo != null) task.AssignedTo = dto.AssignedTo;
        if (dto.CompletedBy != null) task.CompletedBy = dto.CompletedBy;
        if (dto.Remarks != null) task.Remarks = dto.Remarks;

        task.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return new FollowUpTaskDto
        {
            Id = task.Id,
            PatientId = task.PatientId,
            PatientName = task.Patient?.Name ?? "",
            PatientPhone = task.Patient?.Phone,
            AppointmentId = task.AppointmentId,
            TreatmentPlanId = task.TreatmentPlanId,
            Type = task.Type,
            Status = task.Status,
            Title = task.Title,
            Content = task.Content,
            Result = task.Result,
            ScheduledDate = task.ScheduledDate,
            CompletedAt = task.CompletedAt,
            AssignedTo = task.AssignedTo,
            CompletedBy = task.CompletedBy,
            Remarks = task.Remarks,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<bool> DeleteFollowUpTaskAsync(int id)
    {
        var task = await _context.FollowUpTasks.FindAsync(id);
        if (task == null) return false;

        _context.FollowUpTasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteFollowUpTaskAsync(int id, string result, string completedBy)
    {
        var task = await _context.FollowUpTasks.FindAsync(id);
        if (task == null) return false;

        task.Status = FollowUpStatus.Completed;
        task.Result = result;
        task.CompletedAt = DateTime.Now;
        task.CompletedBy = completedBy;
        task.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetFollowUpTaskCountAsync(
        FollowUpStatus? status = null,
        FollowUpType? type = null,
        int? patientId = null,
        int? appointmentId = null)
    {
        var query = _context.FollowUpTasks.AsQueryable();

        if (status.HasValue)
            query = query.Where(f => f.Status == status.Value);

        if (type.HasValue)
            query = query.Where(f => f.Type == type.Value);

        if (patientId.HasValue)
            query = query.Where(f => f.PatientId == patientId.Value);

        if (appointmentId.HasValue)
            query = query.Where(f => f.AppointmentId == appointmentId.Value);

        return await query.CountAsync();
    }
}
