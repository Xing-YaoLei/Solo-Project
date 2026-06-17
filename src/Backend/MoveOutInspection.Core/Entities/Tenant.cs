
namespace MoveOutInspection.Core.Entities;

public class Tenant : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? IdCardNumber { get; set; }
    public string? Email { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public DateTime? LeaseStartDate { get; set; }
    public DateTime? LeaseEndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal Deposit { get; set; }

    public ICollection<MoveOutOrder> MoveOutOrders { get; set; } = new List<MoveOutOrder>();
}
