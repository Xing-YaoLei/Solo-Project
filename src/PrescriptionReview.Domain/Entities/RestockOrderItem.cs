namespace PrescriptionReview.Domain.Entities;

public class RestockOrderItem
{
    public int Id { get; set; }
    public int RestockOrderId { get; set; }
    public RestockOrder? RestockOrder { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Amount { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public DateTime? ExpireDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
