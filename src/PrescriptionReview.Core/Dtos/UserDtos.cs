using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Core.Dtos;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int? StoreId { get; set; }
    public string? StoreName { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UserCreateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? StoreId { get; set; }
    public string Phone { get; set; } = string.Empty;
}

public class UserUpdateDto
{
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? StoreId { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UserQueryDto : PagedQuery
{
    public UserRole? Role { get; set; }
    public int? StoreId { get; set; }
}
