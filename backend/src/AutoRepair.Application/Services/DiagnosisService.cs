using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class DiagnosisService : IDiagnosisService
{
    private readonly IAppDbContext _context;

    public DiagnosisService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DiagnosisDto>> GetAllAsync(Guid? vehicleId = null, Guid? workOrderId = null)
    {
        var query = _context.Diagnoses
            .Include(d => d.Vehicle)
            .Include(d => d.WorkOrder)
            .Include(d => d.DiagnosedByUser)
            .AsQueryable();

        if (vehicleId.HasValue)
        {
            query = query.Where(d => d.VehicleId == vehicleId.Value);
        }

        if (workOrderId.HasValue)
        {
            query = query.Where(d => d.WorkOrderId == workOrderId.Value);
        }

        return await query
            .OrderByDescending(d => d.DiagnosedAt)
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<DiagnosisDto?> GetByIdAsync(Guid id)
    {
        var diagnosis = await _context.Diagnoses
            .Include(d => d.Vehicle)
            .Include(d => d.WorkOrder)
            .Include(d => d.DiagnosedByUser)
            .FirstOrDefaultAsync(d => d.Id == id);

        return diagnosis != null ? MapToDto(diagnosis) : null;
    }

    public async Task<DiagnosisDto> CreateAsync(DiagnosisCreateDto dto, string createdByUserId)
    {
        var diagnosis = new Diagnosis
        {
            Id = Guid.NewGuid(),
            VehicleId = dto.VehicleId,
            WorkOrderId = dto.WorkOrderId,
            DiagnosedByUserId = createdByUserId,
            SymptomDescription = dto.SymptomDescription,
            DiagnosticResult = dto.DiagnosticResult,
            FaultCodes = dto.FaultCodes,
            Recommendations = dto.Recommendations,
            DiagnosedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Diagnoses.Add(diagnosis);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(diagnosis.Id) ?? MapToDto(diagnosis);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var diagnosis = await _context.Diagnoses.FindAsync(id);
        if (diagnosis == null) return false;

        _context.Diagnoses.Remove(diagnosis);
        await _context.SaveChangesAsync();
        return true;
    }

    private static DiagnosisDto MapToDto(Diagnosis d) => new()
    {
        Id = d.Id,
        VehicleId = d.VehicleId,
        VehicleLicensePlate = d.Vehicle?.LicensePlate,
        WorkOrderId = d.WorkOrderId,
        WorkOrderNumber = d.WorkOrder?.OrderNumber,
        DiagnosedByUserId = d.DiagnosedByUserId,
        DiagnosedByUserName = d.DiagnosedByUser?.FullName,
        SymptomDescription = d.SymptomDescription,
        DiagnosticResult = d.DiagnosticResult,
        FaultCodes = d.FaultCodes,
        Recommendations = d.Recommendations,
        DiagnosedAt = d.DiagnosedAt
    };
}
