namespace AutoRepair.Domain.Entities;

public class CommunicationLog
{
    public Guid Id { get; set; }
    public Guid? StockAlertId { get; set; }
    public Guid? QuoteId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string FromUserId { get; set; } = string.Empty;
    public string? ToUserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime SentAt { get; set; }

    public StockAlert? StockAlert { get; set; }
    public Quote? Quote { get; set; }
    public WorkOrder? WorkOrder { get; set; }
    public AppUser? FromUser { get; set; }
    public AppUser? ToUser { get; set; }
}
