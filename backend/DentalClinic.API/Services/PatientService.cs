using DentalClinic.API.Data;
using DentalClinic.API.DTOs;
using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Services;

public class PatientService : IPatientService
{
    private readonly ApplicationDbContext _context;

    public PatientService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PatientSummaryDto>> GetPatientsAsync(string? search = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Name.Contains(search) ||
                p.Phone!.Contains(search) ||
                p.PatientNo.Contains(search));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PatientSummaryDto
            {
                Id = p.Id,
                PatientNo = p.PatientNo,
                Name = p.Name,
                Phone = p.Phone,
                MemberLevel = p.MemberLevel,
                NoShowCount = p.NoShowCount,
                TotalAppointments = p.TotalAppointments
            })
            .ToListAsync();
    }

    public async Task<PatientDto?> GetPatientByIdAsync(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return null;

        return new PatientDto
        {
            Id = patient.Id,
            PatientNo = patient.PatientNo,
            Name = patient.Name,
            Phone = patient.Phone,
            Email = patient.Email,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            MemberLevel = patient.MemberLevel,
            MedicalHistory = patient.MedicalHistory,
            AllergyHistory = patient.AllergyHistory,
            Remarks = patient.Remarks,
            CreatedAt = patient.CreatedAt,
            NoShowCount = patient.NoShowCount,
            TotalAppointments = patient.TotalAppointments
        };
    }

    public async Task<PatientDto> CreatePatientAsync(CreatePatientDto dto)
    {
        var patientNo = await GeneratePatientNoAsync();

        var patient = new Patient
        {
            PatientNo = patientNo,
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            Address = dto.Address,
            MemberLevel = dto.MemberLevel,
            MedicalHistory = dto.MedicalHistory,
            AllergyHistory = dto.AllergyHistory,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return new PatientDto
        {
            Id = patient.Id,
            PatientNo = patient.PatientNo,
            Name = patient.Name,
            Phone = patient.Phone,
            Email = patient.Email,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            MemberLevel = patient.MemberLevel,
            MedicalHistory = patient.MedicalHistory,
            AllergyHistory = patient.AllergyHistory,
            Remarks = patient.Remarks,
            CreatedAt = patient.CreatedAt
        };
    }

    public async Task<PatientDto?> UpdatePatientAsync(int id, UpdatePatientDto dto)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return null;

        patient.Name = dto.Name;
        patient.Phone = dto.Phone;
        patient.Email = dto.Email;
        patient.Gender = dto.Gender;
        patient.DateOfBirth = dto.DateOfBirth;
        patient.Address = dto.Address;
        patient.MemberLevel = dto.MemberLevel;
        patient.MedicalHistory = dto.MedicalHistory;
        patient.AllergyHistory = dto.AllergyHistory;
        patient.Remarks = dto.Remarks;
        patient.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return new PatientDto
        {
            Id = patient.Id,
            PatientNo = patient.PatientNo,
            Name = patient.Name,
            Phone = patient.Phone,
            Email = patient.Email,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            MemberLevel = patient.MemberLevel,
            MedicalHistory = patient.MedicalHistory,
            AllergyHistory = patient.AllergyHistory,
            Remarks = patient.Remarks,
            CreatedAt = patient.CreatedAt,
            NoShowCount = patient.NoShowCount,
            TotalAppointments = patient.TotalAppointments
        };
    }

    public async Task<bool> DeletePatientAsync(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return false;

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PatientSummaryDto?> GetPatientSummaryAsync(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return null;

        return new PatientSummaryDto
        {
            Id = patient.Id,
            PatientNo = patient.PatientNo,
            Name = patient.Name,
            Phone = patient.Phone,
            MemberLevel = patient.MemberLevel,
            NoShowCount = patient.NoShowCount,
            TotalAppointments = patient.TotalAppointments
        };
    }

    public async Task<int> GetPatientCountAsync(string? search = null)
    {
        var query = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Name.Contains(search) ||
                p.Phone!.Contains(search) ||
                p.PatientNo.Contains(search));
        }

        return await query.CountAsync();
    }

    private async Task<string> GeneratePatientNoAsync()
    {
        var today = DateTime.Now;
        var prefix = $"P{today:yyyyMMdd}";
        var lastPatient = await _context.Patients
            .Where(p => p.PatientNo.StartsWith(prefix))
            .OrderByDescending(p => p.PatientNo)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastPatient != null)
        {
            var seqStr = lastPatient.PatientNo.Substring(prefix.Length);
            if (int.TryParse(seqStr, out var seq))
            {
                sequence = seq + 1;
            }
        }

        return $"{prefix}{sequence:D4}";
    }
}
