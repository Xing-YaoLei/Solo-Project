using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Models;

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? CoachId { get; set; }
    public User? Coach { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<DietRecord> DietRecords { get; set; } = new List<DietRecord>();
    public ICollection<BodyMeasurement> BodyMeasurements { get; set; } = new List<BodyMeasurement>();
    public ICollection<CoachComment> CoachComments { get; set; } = new List<CoachComment>();
    public ICollection<CheckInInterruption> Interruptions { get; set; } = new List<CheckInInterruption>();
    public ICollection<User> Clients { get; set; } = new List<User>();
}
