namespace ColdChainScheduler.Domain.Enums;

public enum BatchStatus
{
    Draft = 0,
    Open = 1,
    Closed = 2,
    Delivering = 3,
    Delivered = 4,
    Completed = 5,
    Cancelled = 6
}
