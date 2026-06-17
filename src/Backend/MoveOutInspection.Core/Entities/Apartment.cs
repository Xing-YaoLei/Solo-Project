
namespace MoveOutInspection.Core.Entities;

public class Apartment : EntityBase
{
    public string ApartmentNumber { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }
    public string? Notes { get; set; }

    public ICollection<MoveOutOrder> MoveOutOrders { get; set; } = new List<MoveOutOrder>();
}
