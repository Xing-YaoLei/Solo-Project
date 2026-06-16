using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? StoreId { get; set; }
    public Store? Store { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
