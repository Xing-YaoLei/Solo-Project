using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class TreatmentPlanService : ITreatmentPlanService
{
    private readonly ApplicationDbContext _context;

    public TreatmentPlanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TreatmentPlanDto>> GetTreatmentPlansAsync(
        int? patientId = null,
        TreatmentStatus? status = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.TreatmentPlans
            .Include(tp => tp.Patient)
            .Include(tp => tp.PlanItems)
            .AsQueryable();

        if (patientId.HasValue)
            query = query.Where(tp => tp.PatientId == patientId.Value);

        if (status.HasValue)
            query = query.Where(tp => tp.Status == status.Value);

        return await query
            .OrderByDescending(tp => tp.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(tp => new TreatmentPlanDto
            {
                Id = tp.Id,
                PatientId = tp.PatientId,
                PatientName = tp.Patient!.Name,
                PlanName = tp.PlanName,
                Description = tp.Description,
                Status = tp.Status,
                StartDate = tp.StartDate,
                ExpectedEndDate = tp.ExpectedEndDate,
                ActualEndDate = tp.ActualEndDate,
                EstimatedCost = tp.EstimatedCost,
                ActualCost = tp.ActualCost,
                DoctorName = tp.DoctorName,
                AssistantName = tp.AssistantName,
                TotalVisits = tp.TotalVisits,
                CompletedVisits = tp.CompletedVisits,
                Notes = tp.Notes,
                CreatedAt = tp.CreatedAt,
                PlanItems = tp.PlanItems
                    .OrderBy(i => i.Sequence)
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
                    }).ToList()
            })
            .ToListAsync();
    }

    public async Task<TreatmentPlanDto?> GetTreatmentPlanByIdAsync(int id)
    {
        var plan = await _context.TreatmentPlans
            .Include(tp => tp.Patient)
            .Include(tp => tp.PlanItems)
            .FirstOrDefaultAsync(tp => tp.Id == id);

        if (plan == null) return null;

        return new TreatmentPlanDto
        {
            Id = plan.Id,
            PatientId = plan.PatientId,
            PatientName = plan.Patient!.Name,
            PlanName = plan.PlanName,
            Description = plan.Description,
            Status = plan.Status,
            StartDate = plan.StartDate,
            ExpectedEndDate = plan.ExpectedEndDate,
            ActualEndDate = plan.ActualEndDate,
            EstimatedCost = plan.EstimatedCost,
            ActualCost = plan.ActualCost,
            DoctorName = plan.DoctorName,
            AssistantName = plan.AssistantName,
            TotalVisits = plan.TotalVisits,
            CompletedVisits = plan.CompletedVisits,
            Notes = plan.Notes,
            CreatedAt = plan.CreatedAt,
            PlanItems = plan.PlanItems
                .OrderBy(i => i.Sequence)
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
                }).ToList()
        };
    }

    public async Task<TreatmentPlanDto> CreateTreatmentPlanAsync(CreateTreatmentPlanDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);

        var plan = new TreatmentPlan
        {
            PatientId = dto.PatientId,
            PlanName = dto.PlanName,
            Description = dto.Description,
            Status = TreatmentStatus.Planned,
            StartDate = dto.StartDate,
            ExpectedEndDate = dto.ExpectedEndDate,
            EstimatedCost = dto.EstimatedCost,
            ActualCost = 0,
            DoctorName = dto.DoctorName,
            AssistantName = dto.AssistantName,
            TotalVisits = dto.TotalVisits,
            CompletedVisits = 0,
            Notes = dto.Notes,
            CreatedAt = DateTime.Now
        };

        foreach (var item in dto.PlanItems)
        {
            plan.PlanItems.Add(new TreatmentPlanItem
            {
                ItemName = item.ItemName,
                Description = item.Description,
                Sequence = item.Sequence,
                Price = item.Price,
                Quantity = item.Quantity,
                IsCompleted = false
            });
        }

        _context.TreatmentPlans.Add(plan);
        await _context.SaveChangesAsync();

        return new TreatmentPlanDto
        {
            Id = plan.Id,
            PatientId = plan.PatientId,
            PatientName = patient?.Name ?? "",
            PlanName = plan.PlanName,
            Description = plan.Description,
            Status = plan.Status,
            StartDate = plan.StartDate,
            ExpectedEndDate = plan.ExpectedEndDate,
            EstimatedCost = plan.EstimatedCost,
            ActualCost = plan.ActualCost,
            DoctorName = plan.DoctorName,
            AssistantName = plan.AssistantName,
            TotalVisits = plan.TotalVisits,
            CompletedVisits = plan.CompletedVisits,
            Notes = plan.Notes,
            CreatedAt = plan.CreatedAt,
            PlanItems = plan.PlanItems
                .Select(i => new TreatmentPlanItemDto
                {
                    Id = i.Id,
                    ItemName = i.ItemName,
                    Description = i.Description,
                    Sequence = i.Sequence,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    IsCompleted = i.IsCompleted
                }).ToList()
        };
    }

    public async Task<TreatmentPlanDto?> UpdateTreatmentPlanAsync(int id, UpdateTreatmentPlanDto dto)
    {
        var plan = await _context.TreatmentPlans
            .Include(tp => tp.Patient)
            .Include(tp => tp.PlanItems)
            .FirstOrDefaultAsync(tp => tp.Id == id);

        if (plan == null) return null;

        if (dto.PlanName != null) plan.PlanName = dto.PlanName;
        if (dto.Description != null) plan.Description = dto.Description;
        if (dto.Status.HasValue) plan.Status = dto.Status.Value;
        if (dto.StartDate.HasValue) plan.StartDate = dto.StartDate.Value;
        if (dto.ExpectedEndDate.HasValue) plan.ExpectedEndDate = dto.ExpectedEndDate.Value;
        if (dto.ActualEndDate.HasValue) plan.ActualEndDate = dto.ActualEndDate.Value;
        if (dto.EstimatedCost.HasValue) plan.EstimatedCost = dto.EstimatedCost.Value;
        if (dto.ActualCost.HasValue) plan.ActualCost = dto.ActualCost.Value;
        if (dto.DoctorName != null) plan.DoctorName = dto.DoctorName;
        if (dto.AssistantName != null) plan.AssistantName = dto.AssistantName;
        if (dto.TotalVisits.HasValue) plan.TotalVisits = dto.TotalVisits.Value;
        if (dto.CompletedVisits.HasValue) plan.CompletedVisits = dto.CompletedVisits.Value;
        if (dto.Notes != null) plan.Notes = dto.Notes;

        plan.UpdatedAt = DateTime.Now;

        if (dto.Status == TreatmentStatus.Completed && !plan.ActualEndDate.HasValue)
        {
            plan.ActualEndDate = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        return new TreatmentPlanDto
        {
            Id = plan.Id,
            PatientId = plan.PatientId,
            PatientName = plan.Patient?.Name ?? "",
            PlanName = plan.PlanName,
            Description = plan.Description,
            Status = plan.Status,
            StartDate = plan.StartDate,
            ExpectedEndDate = plan.ExpectedEndDate,
            ActualEndDate = plan.ActualEndDate,
            EstimatedCost = plan.EstimatedCost,
            ActualCost = plan.ActualCost,
            DoctorName = plan.DoctorName,
            AssistantName = plan.AssistantName,
            TotalVisits = plan.TotalVisits,
            CompletedVisits = plan.CompletedVisits,
            Notes = plan.Notes,
            CreatedAt = plan.CreatedAt,
            PlanItems = plan.PlanItems
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
                }).ToList()
        };
    }

    public async Task<bool> DeleteTreatmentPlanAsync(int id)
    {
        var plan = await _context.TreatmentPlans.FindAsync(id);
        if (plan == null) return false;

        _context.TreatmentPlans.Remove(plan);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdatePlanItemStatusAsync(int planItemId, bool isCompleted)
    {
        var item = await _context.TreatmentPlanItems.FindAsync(planItemId);
        if (item == null) return false;

        item.IsCompleted = isCompleted;
        item.CompletedAt = isCompleted ? DateTime.Now : null;

        var plan = await _context.TreatmentPlans.FindAsync(item.TreatmentPlanId);
        if (plan != null)
        {
            var completedCount = await _context.TreatmentPlanItems
                .Where(i => i.TreatmentPlanId == item.TreatmentPlanId && i.IsCompleted)
                .CountAsync();
            plan.CompletedVisits = completedCount;
            plan.UpdatedAt = DateTime.Now;

            var totalItems = await _context.TreatmentPlanItems
                .Where(i => i.TreatmentPlanId == item.TreatmentPlanId)
                .CountAsync();
            if (completedCount == totalItems && plan.Status != TreatmentStatus.Completed)
            {
                plan.Status = TreatmentStatus.Completed;
                plan.ActualEndDate = DateTime.Now;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetTreatmentPlanCountAsync(int? patientId = null, TreatmentStatus? status = null)
    {
        var query = _context.TreatmentPlans.AsQueryable();

        if (patientId.HasValue)
            query = query.Where(tp => tp.PatientId == patientId.Value);

        if (status.HasValue)
            query = query.Where(tp => tp.Status == status.Value);

        return await query.CountAsync();
    }
}
