namespace ScenicTicketBooking.Domain.Enums;

public enum ConflictType
{
    TimeSlotOverlap = 0,
    CapacityExceeded = 1,
    VisitorDuplicate = 2,
    BlacklistVisitor = 3,
    CustomRule = 4
}
