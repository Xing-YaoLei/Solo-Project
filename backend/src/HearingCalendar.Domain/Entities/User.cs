using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class User : BaseEntity
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public UserRole Role { get; set; }
    public string? Department { get; set; }
    public bool IsActive { get; set; }
    public required string PasswordHash { get; set; }
}
