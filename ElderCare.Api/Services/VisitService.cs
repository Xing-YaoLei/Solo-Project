using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class VisitService : IVisitService
{
    private readonly AppDbContext _context;

    public VisitService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<VisitRuleDto>> GetAllRulesAsync()
    {
        return await _context.VisitRecordRules
            .Include(r => r.Area)
            .Select(r => new VisitRuleDto
            {
                Id = r.Id,
                Name = r.Name,
                FrequencyDays = r.FrequencyDays,
                RequiredDurationMinutes = r.RequiredDurationMinutes,
                AreaId = r.AreaId,
                AreaName = r.Area != null ? r.Area.Name : null,
                Priority = r.Priority,
                IsActive = r.IsActive
            })
            .ToListAsync();
    }

    public async Task<VisitRuleDto> CreateRuleAsync(CreateVisitRuleDto dto)
    {
        var entity = new VisitRecordRule
        {
            Name = dto.Name,
            FrequencyDays = dto.FrequencyDays,
            RequiredDurationMinutes = dto.RequiredDurationMinutes,
            AreaId = dto.AreaId,
            Priority = dto.Priority,
            IsActive = dto.IsActive
        };
        _context.VisitRecordRules.Add(entity);
        await _context.SaveChangesAsync();

        var result = await _context.VisitRecordRules
            .Include(r => r.Area)
            .FirstAsync(r => r.Id == entity.Id);

        return new VisitRuleDto
        {
            Id = result.Id,
            Name = result.Name,
            FrequencyDays = result.FrequencyDays,
            RequiredDurationMinutes = result.RequiredDurationMinutes,
            AreaId = result.AreaId,
            AreaName = result.Area != null ? result.Area.Name : null,
            Priority = result.Priority,
            IsActive = result.IsActive
        };
    }

    public async Task<VisitRuleDto?> UpdateRuleAsync(int id, CreateVisitRuleDto dto)
    {
        var entity = await _context.VisitRecordRules.FindAsync(id);
        if (entity == null) return null;
        entity.Name = dto.Name;
        entity.FrequencyDays = dto.FrequencyDays;
        entity.RequiredDurationMinutes = dto.RequiredDurationMinutes;
        entity.AreaId = dto.AreaId;
        entity.Priority = dto.Priority;
        entity.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();

        var result = await _context.VisitRecordRules
            .Include(r => r.Area)
            .FirstAsync(r => r.Id == id);

        return new VisitRuleDto
        {
            Id = result.Id,
            Name = result.Name,
            FrequencyDays = result.FrequencyDays,
            RequiredDurationMinutes = result.RequiredDurationMinutes,
            AreaId = result.AreaId,
            AreaName = result.Area != null ? result.Area.Name : null,
            Priority = result.Priority,
            IsActive = result.IsActive
        };
    }

    public async Task<IEnumerable<VisitRecordDto>> GetAllVisitRecordsAsync()
    {
        return await _context.VisitRecords
            .Include(v => v.Elderly)
            .Include(v => v.Staff)
            .Include(v => v.Rule)
            .Select(v => new VisitRecordDto
            {
                Id = v.Id,
                ElderlyId = v.ElderlyId,
                ElderlyName = v.Elderly.Name,
                StaffId = v.StaffId,
                StaffName = v.Staff.Name,
                RuleId = v.RuleId,
                RuleName = v.Rule != null ? v.Rule.Name : null,
                VisitDate = v.VisitDate,
                Duration = v.Duration,
                Status = v.Status.ToString(),
                Notes = v.Notes,
                NextVisitDate = v.NextVisitDate
            })
            .ToListAsync();
    }

    public async Task<VisitRecordDto> CreateVisitRecordAsync(CreateVisitRecordDto dto)
    {
        var entity = new VisitRecord
        {
            ElderlyId = dto.ElderlyId,
            StaffId = dto.StaffId,
            RuleId = dto.RuleId,
            VisitDate = dto.VisitDate,
            Duration = dto.Duration,
            Status = dto.Status,
            Notes = dto.Notes,
            NextVisitDate = dto.NextVisitDate
        };
        _context.VisitRecords.Add(entity);
        await _context.SaveChangesAsync();

        var result = await _context.VisitRecords
            .Include(v => v.Elderly)
            .Include(v => v.Staff)
            .Include(v => v.Rule)
            .FirstAsync(v => v.Id == entity.Id);

        return new VisitRecordDto
        {
            Id = result.Id,
            ElderlyId = result.ElderlyId,
            ElderlyName = result.Elderly.Name,
            StaffId = result.StaffId,
            StaffName = result.Staff.Name,
            RuleId = result.RuleId,
            RuleName = result.Rule != null ? result.Rule.Name : null,
            VisitDate = result.VisitDate,
            Duration = result.Duration,
            Status = result.Status.ToString(),
            Notes = result.Notes,
            NextVisitDate = result.NextVisitDate
        };
    }

    public async Task<IEnumerable<VisitRecordDto>> GetVisitsByElderlyAsync(int elderlyId)
    {
        return await _context.VisitRecords
            .Include(v => v.Elderly)
            .Include(v => v.Staff)
            .Include(v => v.Rule)
            .Where(v => v.ElderlyId == elderlyId)
            .Select(v => new VisitRecordDto
            {
                Id = v.Id,
                ElderlyId = v.ElderlyId,
                ElderlyName = v.Elderly.Name,
                StaffId = v.StaffId,
                StaffName = v.Staff.Name,
                RuleId = v.RuleId,
                RuleName = v.Rule != null ? v.Rule.Name : null,
                VisitDate = v.VisitDate,
                Duration = v.Duration,
                Status = v.Status.ToString(),
                Notes = v.Notes,
                NextVisitDate = v.NextVisitDate
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<VisitComplianceDto>> CheckVisitComplianceAsync(int elderlyId)
    {
        var rules = await _context.VisitRecordRules
            .Where(r => r.IsActive)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var result = new List<VisitComplianceDto>();

        foreach (var rule in rules)
        {
            var periodStart = now.AddDays(-rule.FrequencyDays);
            var visits = await _context.VisitRecords
                .Where(v => v.ElderlyId == elderlyId && v.RuleId == rule.Id && v.VisitDate >= periodStart)
                .ToListAsync();

            var completed = visits.Count(v => v.Status == VisitStatus.Completed);
            var missed = visits.Count(v => v.Status == VisitStatus.Missed);
            var totalRequired = rule.FrequencyDays > 0 ? 1 : 1;

            result.Add(new VisitComplianceDto
            {
                ElderlyId = elderlyId,
                RuleName = rule.Name,
                TotalRequired = totalRequired,
                Completed = completed,
                Missed = missed,
                ComplianceRate = totalRequired > 0 ? (double)completed / totalRequired * 100 : 0
            });
        }

        return result;
    }
}
