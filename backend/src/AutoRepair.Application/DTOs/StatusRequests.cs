using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.DTOs;

public class UpdateWorkOrderStatusRequest
{
    public WorkOrderStatus Status { get; set; }
}

public class UpdateQuoteStatusRequest
{
    public QuoteStatus Status { get; set; }
}
