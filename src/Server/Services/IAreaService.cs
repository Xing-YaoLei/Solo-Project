using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Services;

public interface IAreaService
{
    Task<List<AreaDto>> GetAllAsync();
    Task<PagedResult<AreaDto>> GetPagedListAsync(AreaQueryDto query);
    Task<AreaDto?> GetByIdAsync(int id);
    Task<AreaDto> CreateAsync(AreaCreateDto dto);
    Task<AreaDto> UpdateAsync(AreaUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class AreaDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AreaQueryDto : PagedQuery
{
    public string? Name { get; set; }
    public bool? IsActive { get; set; }
}

public class AreaCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AreaUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
