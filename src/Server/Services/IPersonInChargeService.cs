using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Services;

public interface IPersonInChargeService
{
    Task<List<PersonInChargeDto>> GetAllAsync();
    Task<PagedResult<PersonInChargeDto>> GetPagedListAsync(PersonInChargeQueryDto query);
    Task<PersonInChargeDto?> GetByIdAsync(int id);
    Task<PersonInChargeDto> CreateAsync(PersonInChargeCreateDto dto);
    Task<PersonInChargeDto> UpdateAsync(PersonInChargeUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<PersonInChargeDto>> GetByAreaIdAsync(int areaId);
}

public class PersonInChargeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Position { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PersonInChargeQueryDto : PagedQuery
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public int? AreaId { get; set; }
    public bool? IsActive { get; set; }
}

public class PersonInChargeCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Position { get; set; }
    public int? AreaId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PersonInChargeUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Position { get; set; }
    public int? AreaId { get; set; }
    public bool IsActive { get; set; }
}
