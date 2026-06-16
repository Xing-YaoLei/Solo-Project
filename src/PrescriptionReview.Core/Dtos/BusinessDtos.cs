using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Core.Dtos;

public class RestockOrderDto
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public string? StoreName { get; set; }
    public int? PrescriptionId { get; set; }
    public string? PrescriptionNo { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public int? OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RestockOrderDetailDto : RestockOrderDto
{
    public List<RestockOrderItemDto> Items { get; set; } = new();
}

public class RestockOrderItemDto
{
    public int Id { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Amount { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public DateTime? ExpireDate { get; set; }
}

public class RestockOrderQueryDto : PagedQuery
{
    public int? StoreId { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? PrescriptionId { get; set; }
}

public class InsuranceRecordDto
{
    public int Id { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public int StoreId { get; set; }
    public string? StoreName { get; set; }
    public int? PrescriptionId { get; set; }
    public string? PrescriptionNo { get; set; }
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
    public DateTime CreatedAt { get; set; }
}

public class InsuranceRecordQueryDto : PagedQuery
{
    public int? StoreId { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? PrescriptionId { get; set; }
    public string? PatientName { get; set; }
}

public class StoreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StoreQueryDto : PagedQuery
{
    public bool? IsActive { get; set; }
}
