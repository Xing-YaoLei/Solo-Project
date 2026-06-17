using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Dtos.CustomerProfile;

public class CustomerProfileDto
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? IdCard { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int SiteCount { get; set; }
}

public class CustomerProfileQueryDto : PagedQuery
{
    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
}

public class CustomerProfileCreateDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? IdCard { get; set; }
    public string? Remark { get; set; }
}

public class CustomerProfileUpdateDto
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? IdCard { get; set; }
    public string? Remark { get; set; }
}
