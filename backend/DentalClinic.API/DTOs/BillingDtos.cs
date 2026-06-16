using DentalClinic.API.Enums;

namespace DentalClinic.API.DTOs;

public class BillingRecordDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime BillingDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public BillingStatus Status { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Remarks { get; set; }
    public string? Cashier { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BillingItemDto> BillingItems { get; set; } = new();
}

public class BillingItemDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class CreateBillingRecordDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int? TreatmentPlanId { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Remarks { get; set; }
    public string? Cashier { get; set; }
    public List<CreateBillingItemDto> BillingItems { get; set; } = new();
}

public class CreateBillingItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public class UpdateBillingRecordDto
{
    public BillingStatus? Status { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? PaidAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Remarks { get; set; }
    public string? Cashier { get; set; }
}
