using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Core.Dtos;

public class PrescriptionDto
{
    public int Id { get; set; }
    public string PrescriptionNo { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Hospital { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
    public int StoreId { get; set; }
    public string? StoreName { get; set; }
    public PrescriptionStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public int? CashierId { get; set; }
    public string? CashierName { get; set; }
    public int? PharmacistId { get; set; }
    public string? PharmacistName { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
    public int AttachmentCount { get; set; }
    public bool HasUnclearRecord { get; set; }
}

public class PrescriptionDetailDto : PrescriptionDto
{
    public List<PrescriptionItemDto> Items { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
    public List<AuditLogDto> AuditLogs { get; set; } = new();
    public List<SupplementNoteDto> SupplementNotes { get; set; } = new();
    public List<PharmacistOpinionDto> PharmacistOpinions { get; set; } = new();
    public FollowUpDto? FollowUp { get; set; }
}

public class PrescriptionCreateDto
{
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
    public string? Remark { get; set; }
    public List<PrescriptionItemCreateDto> Items { get; set; } = new();
}

public class PrescriptionUpdateDto
{
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public string PatientIdCard { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Hospital { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
    public string? Remark { get; set; }
    public List<PrescriptionItemCreateDto> Items { get; set; } = new();
}

public class PrescriptionQueryDto : PagedQuery
{
    public PrescriptionStatus? Status { get; set; }
    public int? StoreId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PatientName { get; set; }
    public int? PharmacistId { get; set; }
    public bool? HasUnclearRecord { get; set; }
}

public class PrescriptionReviewDto
{
    public bool IsApproved { get; set; }
    public string Opinion { get; set; } = string.Empty;
    public string? Remark { get; set; }
}

public class PrescriptionBatchReviewDto
{
    public List<int> Ids { get; set; } = new();
    public bool IsApproved { get; set; }
    public string Opinion { get; set; } = string.Empty;
}

public class PrescriptionStatusChangeDto
{
    public PrescriptionStatus Status { get; set; }
    public string? Remark { get; set; }
}

public class PrescriptionItemDto
{
    public int Id { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Remark { get; set; }
}

public class PrescriptionItemCreateDto
{
    public string DrugName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Remark { get; set; }
}
