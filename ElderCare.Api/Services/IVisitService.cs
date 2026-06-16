using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IVisitService
{
    Task<IEnumerable<VisitRuleDto>> GetAllRulesAsync();
    Task<VisitRuleDto> CreateRuleAsync(CreateVisitRuleDto dto);
    Task<VisitRuleDto?> UpdateRuleAsync(int id, CreateVisitRuleDto dto);
    Task<IEnumerable<VisitRecordDto>> GetAllVisitRecordsAsync();
    Task<VisitRecordDto> CreateVisitRecordAsync(CreateVisitRecordDto dto);
    Task<IEnumerable<VisitRecordDto>> GetVisitsByElderlyAsync(int elderlyId);
    Task<IEnumerable<VisitComplianceDto>> CheckVisitComplianceAsync(int elderlyId);
}
