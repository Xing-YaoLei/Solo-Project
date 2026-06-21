using CourierVerification.Enums;

namespace CourierVerification.DTOs;

public class CreateVerificationRecordDto
{
    public Guid OrderId { get; set; }
    public Guid? RiderId { get; set; }
    public string? AssignedTo { get; set; }
    public string? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? Remark { get; set; }
    public List<string>? RatingTags { get; set; }
    public string? RiderTrajectory { get; set; }
}

public class UpdateVerificationRecordDto
{
    public VerificationStatus? Status { get; set; }
    public VerificationStage? Stage { get; set; }
    public string? AssignedTo { get; set; }
    public string? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? Remark { get; set; }
    public List<string>? RatingTags { get; set; }
    public string? RiderTrajectory { get; set; }
}

public class ConfirmationDto
{
    public string? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? Remark { get; set; }
}

public class SupplementDto
{
    public string? Remark { get; set; }
    public List<string>? RatingTags { get; set; }
    public List<IFormFile>? Files { get; set; }
}

public class CloseDto
{
    public string? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? ClosingRemark { get; set; }
}

public class DamageReportDto
{
    public DamageRange DamageRange { get; set; }
    public DamageSeverity Severity { get; set; }
    public string DamageDescription { get; set; } = string.Empty;
    public List<string> AffectedItems { get; set; } = new();
    public ResponsibleParty InitialResponsibility { get; set; }
    public string? ReportedBy { get; set; }
}

public class ResponsibilityAdjustmentDto
{
    public ResponsibleParty FinalResponsibility { get; set; }
    public string? AdjustmentReason { get; set; }
    public string? AdjustedBy { get; set; }
    public string? SupplementaryNotes { get; set; }
}

public class ReviewDto
{
    public string Reviewer { get; set; } = string.Empty;
    public string Findings { get; set; } = string.Empty;
    public string? ActionsTaken { get; set; }
    public string Conclusion { get; set; } = string.Empty;
    public bool FollowUpRequired { get; set; }
    public string? FollowUpNote { get; set; }
}

public class CreateOrderDto
{
    public string OrderNumber { get; set; } = string.Empty;
    public string PickupAddress { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string? PackageDescription { get; set; }
    public Guid? RiderId { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class RiderActivityDto
{
    public Guid RiderId { get; set; }
    public string RiderName { get; set; } = string.Empty;
    public RiderStatus Status { get; set; }
    public int TotalDeliveries { get; set; }
    public int TotalVerifications { get; set; }
    public int DamageIncidents { get; set; }
    public decimal Rating { get; set; }
}
