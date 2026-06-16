using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class QueryService : IQueryService
{
    private readonly AppDbContext _context;

    public QueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<object>> CombinedQueryAsync(CombinedQueryDto query)
    {
        var items = new List<object>();
        var totalCount = 0;

        switch (query.EntityType?.ToLower())
        {
            case "elderly":
                var elderlyQ = _context.ElderlyProfiles
                    .Include(e => e.Area)
                    .Include(e => e.PrimaryStaff)
                    .AsQueryable();
                if (!string.IsNullOrEmpty(query.Status))
                    elderlyQ = elderlyQ.Where(e => e.Status == query.Status);
                if (query.AreaId.HasValue)
                    elderlyQ = elderlyQ.Where(e => e.AreaId == query.AreaId.Value);
                if (query.StartDate.HasValue)
                    elderlyQ = elderlyQ.Where(e => e.AdmissionDate >= query.StartDate.Value);
                if (query.EndDate.HasValue)
                    elderlyQ = elderlyQ.Where(e => e.AdmissionDate <= query.EndDate.Value);
                totalCount = await elderlyQ.CountAsync();
                items = await elderlyQ
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(e => (object)new ElderlyDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Gender = e.Gender,
                        BirthDate = e.BirthDate,
                        RoomNumber = e.RoomNumber,
                        AreaId = e.AreaId,
                        AreaName = e.Area.Name,
                        PrimaryStaffId = e.PrimaryStaffId,
                        PrimaryStaffName = e.PrimaryStaff.Name,
                        HealthConditions = e.HealthConditions,
                        EmergencyContact = e.EmergencyContact,
                        EmergencyPhone = e.EmergencyPhone,
                        AdmissionDate = e.AdmissionDate,
                        Status = e.Status
                    })
                    .ToListAsync();
                break;

            case "riskevent":
                var riskQ = _context.RiskEvents
                    .Include(r => r.Elderly)
                    .Include(r => r.Area)
                    .Include(r => r.ReportedByStaff)
                    .Include(r => r.AssignedStaff)
                    .AsQueryable();
                if (!string.IsNullOrEmpty(query.Status))
                    riskQ = riskQ.Where(r => r.Status == query.Status);
                if (query.AreaId.HasValue)
                    riskQ = riskQ.Where(r => r.AreaId == query.AreaId.Value);
                if (query.StaffId.HasValue)
                    riskQ = riskQ.Where(r => r.AssignedStaffId == query.StaffId.Value || r.ReportedByStaffId == query.StaffId.Value);
                if (query.StartDate.HasValue)
                    riskQ = riskQ.Where(r => r.EventTime >= query.StartDate.Value);
                if (query.EndDate.HasValue)
                    riskQ = riskQ.Where(r => r.EventTime <= query.EndDate.Value);
                totalCount = await riskQ.CountAsync();
                items = await riskQ
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(r => (object)new RiskEventDto
                    {
                        Id = r.Id,
                        ElderlyId = r.ElderlyId,
                        ElderlyName = r.Elderly.Name,
                        EventType = r.EventType.ToString(),
                        Severity = r.Severity.ToString(),
                        Description = r.Description,
                        EventTime = r.EventTime,
                        Location = r.Location,
                        AreaId = r.AreaId,
                        AreaName = r.Area.Name,
                        ReportedByStaffId = r.ReportedByStaffId,
                        ReportedByStaffName = r.ReportedByStaff.Name,
                        AssignedStaffId = r.AssignedStaffId,
                        AssignedStaffName = r.AssignedStaff.Name,
                        Status = r.Status,
                        Resolution = r.Resolution,
                        ResolvedAt = r.ResolvedAt
                    })
                    .ToListAsync();
                break;

            case "schedules":
                var schedQ = _context.MedicationSchedules
                    .Include(s => s.Elderly)
                    .Include(s => s.MedicationDict)
                    .Include(s => s.CreatedByStaff)
                    .AsQueryable();
                if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<Models.Enums.MedicationStatus>(query.Status, true, out var medStatus))
                    schedQ = schedQ.Where(s => s.Status == medStatus);
                if (query.StartDate.HasValue)
                    schedQ = schedQ.Where(s => s.StartTime >= query.StartDate.Value);
                if (query.EndDate.HasValue)
                    schedQ = schedQ.Where(s => s.StartTime <= query.EndDate.Value);
                totalCount = await schedQ.CountAsync();
                items = await schedQ
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(s => (object)new ScheduleDto
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
                break;

            case "visits":
                var visitQ = _context.VisitRecords
                    .Include(v => v.Elderly)
                    .Include(v => v.Staff)
                    .Include(v => v.Rule)
                    .AsQueryable();
                if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<Models.Enums.VisitStatus>(query.Status, true, out var vStatus))
                    visitQ = visitQ.Where(v => v.Status == vStatus);
                if (query.StaffId.HasValue)
                    visitQ = visitQ.Where(v => v.StaffId == query.StaffId.Value);
                if (query.StartDate.HasValue)
                    visitQ = visitQ.Where(v => v.VisitDate >= query.StartDate.Value);
                if (query.EndDate.HasValue)
                    visitQ = visitQ.Where(v => v.VisitDate <= query.EndDate.Value);
                totalCount = await visitQ.CountAsync();
                items = await visitQ
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(v => (object)new VisitRecordDto
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
                break;

            case "checkins":
                var checkInQ = _context.ActivityCheckIns
                    .Include(c => c.Elderly)
                    .Include(c => c.Staff)
                    .AsQueryable();
                if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<Models.Enums.CheckInStatus>(query.Status, true, out var cStatus))
                    checkInQ = checkInQ.Where(c => c.Status == cStatus);
                if (query.StaffId.HasValue)
                    checkInQ = checkInQ.Where(c => c.StaffId == query.StaffId.Value);
                if (query.StartDate.HasValue)
                    checkInQ = checkInQ.Where(c => c.CheckInTime >= query.StartDate.Value);
                if (query.EndDate.HasValue)
                    checkInQ = checkInQ.Where(c => c.CheckInTime <= query.EndDate.Value);
                totalCount = await checkInQ.CountAsync();
                items = await checkInQ
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(c => (object)new CheckInDto
                    {
                        Id = c.Id,
                        ElderlyId = c.ElderlyId,
                        ElderlyName = c.Elderly.Name,
                        ActivityName = c.ActivityName,
                        StaffId = c.StaffId,
                        StaffName = c.Staff.Name,
                        CheckInTime = c.CheckInTime,
                        Status = c.Status.ToString(),
                        ThresholdId = c.ThresholdId,
                        Notes = c.Notes
                    })
                    .ToListAsync();
                break;

            default:
                totalCount = 0;
                break;
        }

        return new PagedResult<object>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
