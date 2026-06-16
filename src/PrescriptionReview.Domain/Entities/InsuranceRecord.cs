namespace PrescriptionReview.Domain.Entities;

public class InsuranceRecord
{
    public int Id { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public Store? Store { get; set; }
    public int? PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string IdCard { get; set; } = string.Empty;
    public string InsuranceCardNo { get; set; } = string.Empty;
    public DateTime TradeDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal InsurancePay { get; set; }
    public decimal SelfPay { get; set; }
    public string TradeType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
}
