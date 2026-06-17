using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TagGroupRule;

namespace SiteSchedule.Services;

public interface ITagGroupRuleService
{
    Task<PagedResult<TagGroupRuleDto>> GetPagedListAsync(TagGroupRuleQueryDto query);
    Task<TagGroupRuleDto?> GetByIdAsync(int id);
    Task<TagGroupRuleDto> CreateAsync(TagGroupRuleCreateDto dto);
    Task<TagGroupRuleDto> UpdateAsync(TagGroupRuleUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<TagGroupRuleDto>> GetAllAsync();
}
