namespace PrescriptionReview.Domain.Entities;

public class PharmacistOpinion
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public int PharmacistId { get; set; }
    public User? Pharmacist { get; set; }
    public string Opinion { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
