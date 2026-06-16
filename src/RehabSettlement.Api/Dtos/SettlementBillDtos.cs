namespace RehabSettlement.Api.Dtos;

public class SettlementBillDto
{
    public int Id { get; set; }
    public string BillNo { get; set; } = string.Empty;
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? PatientNo { get; set; }
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int? SourceChannelId { get; set; }
    public string? SourceChannelName { get; set; }
    public int? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public DateOnly? TreatmentStartDate { get; set; }
    public DateOnly? TreatmentEndDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal InsuranceAmount { get; set; }
    public decimal SelfPayAmount { get; set; }
    public string? RejectionRemark { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public List<SettlementItemDto> Items { get; set; } = new();
    public List<string>? ReviewTags { get; set; }
}

public class SettlementItemDto
{
    public int Id { get; set; }
    public int BillId { get; set; }
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal? InsuranceCoverage { get; set; }
    public decimal InsuranceAmount { get; set; }
    public decimal SelfPayAmount { get; set; }
    public string? Remark { get; set; }
    public int SortOrder { get; set; }
}

public class CreateSettlementBillDto
{
    public int PatientId { get; set; }
    public int? SourceChannelId { get; set; }
    public int? AssigneeId { get; set; }
    public DateOnly? TreatmentStartDate { get; set; }
    public DateOnly? TreatmentEndDate { get; set; }
    public string? Remark { get; set; }
    public List<CreateSettlementItemDto> Items { get; set; } = new();
}

public class CreateSettlementItemDto
{
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? InsuranceCoverage { get; set; }
    public string? Remark { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateSettlementBillDto
{
    public int? SourceChannelId { get; set; }
    public int? AssigneeId { get; set; }
    public DateOnly? TreatmentStartDate { get; set; }
    public DateOnly? TreatmentEndDate { get; set; }
    public string? Remark { get; set; }
    public List<UpdateSettlementItemDto>? Items { get; set; }
}

public class UpdateSettlementItemDto
{
    public int? Id { get; set; }
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemType { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? InsuranceCoverage { get; set; }
    public string? Remark { get; set; }
    public int SortOrder { get; set; }
}

public class BillListQueryDto
{
    public int? StatusId { get; set; }
    public int? AssigneeId { get; set; }
    public int? SourceChannelId { get; set; }
    public string? SearchKeyword { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
