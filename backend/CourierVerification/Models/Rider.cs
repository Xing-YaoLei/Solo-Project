using CourierVerification.Enums;

namespace CourierVerification.Models;

public class Rider
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? EmployeeNo { get; set; }
    public string? AvatarUrl { get; set; }
    public string? VehicleNumber { get; set; }
    public RiderStatus Status { get; set; }
    public string? CurrentLocation { get; set; }
    public decimal Rating { get; set; }
    public int TotalDeliveries { get; set; }
    public int TotalVerifications { get; set; }
    public int DamageIncidents { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<VerificationRecord> VerificationRecords { get; set; } = new List<VerificationRecord>();
}
