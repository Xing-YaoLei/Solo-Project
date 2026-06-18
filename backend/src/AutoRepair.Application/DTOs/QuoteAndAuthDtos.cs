using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.DTOs;

public class QuoteDto
{
    public Guid Id { get; set; }
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid WorkOrderId { get; set; }
    public string WorkOrderNumber { get; set; } = string.Empty;
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public QuoteStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public decimal PartsTotal { get; set; }
    public decimal LaborTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public string? CustomerNotes { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime? ValidUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<QuoteItemDto> Items { get; set; } = new();
    public List<ReviewOpinionDto> ReviewOpinions { get; set; } = new();
    public List<CommunicationLogDto> CommunicationLogs { get; set; } = new();
}

public class QuoteItemDto
{
    public Guid Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsPart { get; set; }
    public Guid? PartId { get; set; }
    public string? PartName { get; set; }
}

public class QuoteCreateDto
{
    public Guid WorkOrderId { get; set; }
    public string? CustomerNotes { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime? ValidUntil { get; set; }
    public List<QuoteItemCreateDto> Items { get; set; } = new();
}

public class QuoteItemCreateDto
{
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LaborCost { get; set; }
    public bool IsPart { get; set; }
    public Guid? PartId { get; set; }
}

public class ReviewOpinionDto
{
    public Guid Id { get; set; }
    public string ReviewerUserId { get; set; } = string.Empty;
    public string ReviewerUserName { get; set; } = string.Empty;
    public string Opinion { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class ReviewOpinionCreateDto
{
    public Guid QuoteId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string Opinion { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
}

public class ReworkRateDto
{
    public DateTime Date { get; set; }
    public int TotalOrders { get; set; }
    public int ReworkOrders { get; set; }
    public decimal ReworkRate { get; set; }
}

public class DashboardStatsDto
{
    public int TodayPendingOrders { get; set; }
    public int TodayInProgress { get; set; }
    public int TodayCompleted { get; set; }
    public int LowStockAlerts { get; set; }
    public int CriticalStockAlerts { get; set; }
    public int ThisMonthReworkRate { get; set; }
    public List<ReworkRateDto> ReworkTrend { get; set; } = new();
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Position { get; set; }
    public List<string> Roles { get; set; } = new();
    public string Token { get; set; } = string.Empty;
}
