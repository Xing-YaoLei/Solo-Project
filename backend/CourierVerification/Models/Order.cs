using CourierVerification.Enums;

namespace CourierVerification.Models;

public class Order
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string PickupAddress { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? PackageDescription { get; set; }
    public Guid? RiderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTimeOffset? ScheduledPickupTime { get; set; }
    public DateTimeOffset? ActualPickupTime { get; set; }
    public DateTimeOffset? ActualDeliveryTime { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public virtual Rider? Rider { get; set; }
    public virtual ICollection<VerificationRecord> VerificationRecords { get; set; } = new List<VerificationRecord>();
}
