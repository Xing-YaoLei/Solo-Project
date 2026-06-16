using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class AppointmentService : IAppointmentService
{
    private readonly ApplicationDbContext _context;

    public AppointmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AppointmentListDto>> GetAppointmentsAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        AppointmentStatus? status = null,
        int? patientId = null,
        RiskLevel? riskLevel = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(a => a.AppointmentDate >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(a => a.AppointmentDate <= endDate.Value.Date);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (patientId.HasValue)
            query = query.Where(a => a.PatientId == patientId.Value);

        if (riskLevel.HasValue)
            query = query.Where(a => a.RiskLevel >= riskLevel.Value);

        return await query
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AppointmentListDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient!.Name,
                PatientPhone = a.Patient.Phone!,
                MemberLevel = a.Patient.MemberLevel,
                AppointmentDate = a.AppointmentDate,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Subject = a.Subject,
                Status = a.Status,
                RiskLevel = a.RiskLevel,
                DoctorName = a.DoctorName,
                ChairNumber = a.ChairNumber,
                PatientNoShowCount = a.Patient.NoShowCount,
                HasTreatmentPlan = a.TreatmentPlanId.HasValue,
                HasFollowUpTasks = a.FollowUpTasks.Any(),
                HasImages = a.ImageAttachments.Any(),
                HasBilling = a.BillingRecords.Any()
            })
            .ToListAsync();
    }

    public async Task<AppointmentDetailDto?> GetAppointmentByIdAsync(int id)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.TreatmentPlan)
                .ThenInclude(tp => tp.PlanItems)
            .Include(a => a.FollowUpTasks)
            .Include(a => a.ImageAttachments)
            .Include(a => a.BillingRecords)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null) return null;

        return new AppointmentDetailDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient!.Name,
            PatientPhone = appointment.Patient.Phone!,
            PatientEmail = appointment.Patient.Email,
            PatientGender = appointment.Patient.Gender,
            MemberLevel = appointment.Patient.MemberLevel,
            PatientNoShowCount = appointment.Patient.NoShowCount,
            PatientTotalAppointments = appointment.Patient.TotalAppointments,
            TreatmentPlanId = appointment.TreatmentPlanId,
            TreatmentPlanName = appointment.TreatmentPlan?.PlanName,
            TreatmentPlanStatus = appointment.TreatmentPlan?.Status,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Subject = appointment.Subject,
            Description = appointment.Description,
            Status = appointment.Status,
            DoctorName = appointment.DoctorName,
            AssistantName = appointment.AssistantName,
            ChairNumber = appointment.ChairNumber,
            RiskLevel = appointment.RiskLevel,
            CommunicationNotes = appointment.CommunicationNotes,
            ReviewComments = appointment.ReviewComments,
            PlanItems = appointment.TreatmentPlan?.PlanItems
                .Select(i => new TreatmentPlanItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Description = i.Description,
                    Sequence = i.Sequence,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    IsCompleted = i.IsCompleted,
                    CompletedAt = i.CompletedAt
                }).ToList(),
            FollowUpTasks = appointment.FollowUpTasks
                .Select(f => new FollowUpTaskDto
                {
                    Id = f.Id,
                    PatientId = f.PatientId,
                    PatientName = appointment.Patient.Name,
                    PatientPhone = appointment.Patient.Phone,
                    Type = f.Type,
                    Status = f.Status,
                    Title = f.Title,
                    Content = f.Content,
                    Result = f.Result,
                    ScheduledDate = f.ScheduledDate,
                    CompletedAt = f.CompletedAt,
                    AssignedTo = f.AssignedTo,
                    CreatedAt = f.CreatedAt
                }).ToList(),
            ImageAttachments = appointment.ImageAttachments
                .Select(img => new ImageAttachmentDto
                {
                    Id = img.Id,
                    PatientId = img.PatientId,
                    PatientName = appointment.Patient.Name,
                    FileName = img.FileName,
                    FileType = img.FileType,
                    FileSize = img.FileSize,
                    Description = img.Description,
                    Category = img.Category,
                    UploadedAt = img.UploadedAt
                }).ToList(),
            BillingRecords = appointment.BillingRecords
                .Select(b => new BillingRecordDto
                {
                    Id = b.Id,
                    InvoiceNo = b.InvoiceNo,
                    BillingDate = b.BillingDate,
                    TotalAmount = b.TotalAmount,
                    PaidAmount = b.PaidAmount,
                    RemainingAmount = b.RemainingAmount,
                    Status = b.Status
                }).ToList()
        };
    }

    public async Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        var riskLevel = CalculateRiskLevel(patient);

        var appointment = new Appointment
        {
            PatientId = dto.PatientId,
            TreatmentPlanId = dto.TreatmentPlanId,
            AppointmentDate = dto.AppointmentDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Subject = dto.Subject,
            Description = dto.Description,
            Status = AppointmentStatus.Scheduled,
            DoctorName = dto.DoctorName,
            AssistantName = dto.AssistantName,
            ChairNumber = dto.ChairNumber,
            RiskLevel = riskLevel,
            NoShowCount = patient?.NoShowCount ?? 0,
            CreatedAt = DateTime.Now
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = patient?.Name ?? "",
            PatientPhone = patient?.Phone ?? "",
            TreatmentPlanId = appointment.TreatmentPlanId,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Subject = appointment.Subject,
            Description = appointment.Description,
            Status = appointment.Status,
            DoctorName = appointment.DoctorName,
            AssistantName = appointment.AssistantName,
            ChairNumber = appointment.ChairNumber,
            RiskLevel = appointment.RiskLevel,
            CreatedAt = appointment.CreatedAt
        };
    }

    public async Task<AppointmentDto?> UpdateAppointmentAsync(int id, UpdateAppointmentDto dto)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null) return null;

        if (dto.AppointmentDate.HasValue)
            appointment.AppointmentDate = dto.AppointmentDate.Value;

        if (dto.StartTime.HasValue)
            appointment.StartTime = dto.StartTime.Value;

        if (dto.EndTime.HasValue)
            appointment.EndTime = dto.EndTime.Value;

        if (dto.Subject != null)
            appointment.Subject = dto.Subject;

        if (dto.Description != null)
            appointment.Description = dto.Description;

        if (dto.Status.HasValue)
            appointment.Status = dto.Status.Value;

        if (dto.DoctorName != null)
            appointment.DoctorName = dto.DoctorName;

        if (dto.AssistantName != null)
            appointment.AssistantName = dto.AssistantName;

        if (dto.ChairNumber != null)
            appointment.ChairNumber = dto.ChairNumber;

        if (dto.CommunicationNotes != null)
            appointment.CommunicationNotes = dto.CommunicationNotes;

        if (dto.ReviewComments != null)
            appointment.ReviewComments = dto.ReviewComments;

        appointment.UpdatedAt = DateTime.Now;

        if (dto.Status == AppointmentStatus.NoShow)
        {
            var patient = appointment.Patient;
            if (patient != null)
            {
                patient.NoShowCount++;
                appointment.RiskLevel = CalculateRiskLevel(patient);
            }
        }

        await _context.SaveChangesAsync();

        return new AppointmentDto
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = appointment.Patient?.Name ?? "",
            PatientPhone = appointment.Patient?.Phone ?? "",
            TreatmentPlanId = appointment.TreatmentPlanId,
            AppointmentDate = appointment.AppointmentDate,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Subject = appointment.Subject,
            Description = appointment.Description,
            Status = appointment.Status,
            DoctorName = appointment.DoctorName,
            AssistantName = appointment.AssistantName,
            ChairNumber = appointment.ChairNumber,
            RiskLevel = appointment.RiskLevel,
            CommunicationNotes = appointment.CommunicationNotes,
            ReviewComments = appointment.ReviewComments,
            CreatedAt = appointment.CreatedAt
        };
    }

    public async Task<bool> DeleteAppointmentAsync(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAppointmentStatusAsync(int id, AppointmentStatus status)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        appointment.Status = status;
        appointment.UpdatedAt = DateTime.Now;

        if (status == AppointmentStatus.Completed)
        {
            var patient = await _context.Patients.FindAsync(appointment.PatientId);
            if (patient != null)
            {
                patient.TotalAppointments++;
            }
        }

        if (status == AppointmentStatus.NoShow)
        {
            var patient = await _context.Patients.FindAsync(appointment.PatientId);
            if (patient != null)
            {
                patient.NoShowCount++;
                patient.TotalAppointments++;
                appointment.RiskLevel = CalculateRiskLevel(patient);
                appointment.NoShowCount = patient.NoShowCount;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<NoShowAppointmentDto>> GetNoShowAppointmentsAsync(RiskLevel? minRiskLevel = null)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.Status == AppointmentStatus.NoShow)
            .AsQueryable();

        if (minRiskLevel.HasValue)
            query = query.Where(a => a.RiskLevel >= minRiskLevel.Value);

        return await query
            .OrderByDescending(a => a.RiskLevel)
            .ThenBy(a => a.AppointmentDate)
            .Select(a => new NoShowAppointmentDto
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient!.Name,
                PatientPhone = a.Patient.Phone!,
                MemberLevel = a.Patient.MemberLevel,
                AppointmentDate = a.AppointmentDate,
                StartTime = a.StartTime,
                RiskLevel = a.RiskLevel,
                PatientNoShowCount = a.Patient.NoShowCount,
                CommunicationNotes = a.CommunicationNotes,
                ReviewComments = a.ReviewComments,
                HasFollowUp = a.FollowUpTasks.Any()
            })
            .ToListAsync();
    }

    public async Task<bool> UpdateCommunicationNotesAsync(int id, string notes)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        appointment.CommunicationNotes = notes;
        appointment.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateReviewCommentsAsync(int id, string comments)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return false;

        appointment.ReviewComments = comments;
        appointment.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetAppointmentCountAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        AppointmentStatus? status = null,
        int? patientId = null,
        RiskLevel? riskLevel = null)
    {
        var query = _context.Appointments.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(a => a.AppointmentDate >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(a => a.AppointmentDate <= endDate.Value.Date);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (patientId.HasValue)
            query = query.Where(a => a.PatientId == patientId.Value);

        if (riskLevel.HasValue)
            query = query.Where(a => a.RiskLevel >= riskLevel.Value);

        return await query.CountAsync();
    }

    private static RiskLevel CalculateRiskLevel(Patient? patient)
    {
        if (patient == null || patient.TotalAppointments == 0) return RiskLevel.Low;

        var noShowRate = (double)patient.NoShowCount / patient.TotalAppointments;

        if (noShowRate >= 0.5) return RiskLevel.Critical;
        if (noShowRate >= 0.3) return RiskLevel.High;
        if (noShowRate >= 0.15) return RiskLevel.Medium;
        return RiskLevel.Low;
    }
}
