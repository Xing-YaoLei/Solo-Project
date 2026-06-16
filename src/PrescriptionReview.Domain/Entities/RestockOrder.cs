namespace PrescriptionReview.Domain.Entities;

public class RestockOrder
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int? PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public int? OperatorId { get; set; }
    public User? Operator { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<RestockOrderItem> Items { get; set; } = new List<RestockOrderItem>();
}
