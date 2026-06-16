namespace PrescriptionReview.Domain.Entities;

public class PrescriptionItem
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
