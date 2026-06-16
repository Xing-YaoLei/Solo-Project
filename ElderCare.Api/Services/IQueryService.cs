using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IQueryService
{
    Task<PagedResult<object>> CombinedQueryAsync(CombinedQueryDto query);
}
