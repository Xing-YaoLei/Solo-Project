using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Models;

public class BillingRecord
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }

    [ForeignKey("Appointment")]
    public int? AppointmentId { get; set; }

    [ForeignKey("TreatmentPlan")]
    public int? TreatmentPlanId { get; set; }

    [MaxLength(50)]
    public string InvoiceNo { get; set; } = string.Empty;

    public DateTime BillingDate { get; set; } = DateTime.Now;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RemainingAmount { get; set; }

    public BillingStatus Status { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [MaxLength(100)]
    public string? Cashier { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual Appointment? Appointment { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual ICollection<BillingItem> BillingItems { get; set; } = new List<BillingItem>();
}

public class BillingItem
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("BillingRecord")]
    public int BillingRecordId { get; set; }

    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    public virtual BillingRecord? BillingRecord { get; set; }
}
