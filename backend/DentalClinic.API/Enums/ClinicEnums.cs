namespace DentalClinic.API.Enums;

public enum AppointmentStatus
{
    Scheduled = 0,
    Confirmed = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    NoShow = 5
}

public enum RiskLevel
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum Gender
{
    Male = 0,
    Female = 1,
    Other = 2
}

public enum FollowUpStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}

public enum FollowUpType
{
    Phone = 0,
    SMS = 1,
    WeChat = 2,
    Email = 3,
    InPerson = 4
}

public enum TreatmentStatus
{
    Planned = 0,
    InProgress = 1,
    Completed = 2,
    Suspended = 3
}

public enum BillingStatus
{
    Unpaid = 0,
    PartialPaid = 1,
    Paid = 2,
    Refunded = 3
}

public enum MemberLevel
{
    Regular = 0,
    Silver = 1,
    Gold = 2,
    Platinum = 3
}
