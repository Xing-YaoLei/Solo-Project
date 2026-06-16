using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Domain.Entities;

public class Prescription
{
    public int Id { get; set; }
    public string PrescriptionNo { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string PatientIdCard { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Hospital { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Pending;
    public string? Remark { get; set; }
    public int? CashierId { get; set; }
    public User? Cashier { get; set; }
    public int? PharmacistId { get; set; }
    public User? Pharmacist { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<SupplementNote> SupplementNotes { get; set; } = new List<SupplementNote>();
    public ICollection<PharmacistOpinion> PharmacistOpinions { get; set; } = new List<PharmacistOpinion>();
    public FollowUp? FollowUp { get; set; }
}
