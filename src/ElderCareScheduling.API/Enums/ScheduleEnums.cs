namespace ElderCareScheduling.API.Enums;

public enum ScheduleStatus
{
    Draft = 0,
    Submitted = 10,
    UnderReview = 20,
    ReviewApproved = 30,
    ReviewRejected = 35,
    InProgress = 40,
    Processing = 45,
    ExceptionOccurred = 50,
    Completed = 60,
    UnderReviewPost = 70,
    Reviewed = 80,
    Closed = 90,
    Archived = 100
}

public enum CareLevelType
{
    Independent = 1,
    SemiAssisted = 2,
    FullAssisted = 3,
    Intensive = 4,
    Special = 5
}

public enum ShiftType
{
    Morning = 1,
    Afternoon = 2,
    Night = 3,
    FullDay = 4
}

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}

public enum BedStatus
{
    Available = 0,
    Occupied = 1,
    Reserved = 2,
    Maintenance = 3,
    Cleaning = 4
}

public enum ExceptionType
{
    Fall = 1,
    MedicationError = 2,
    Missing = 3,
    PhysicalDiscomfort = 4,
    EquipmentFailure = 5,
    Other = 99
}

public enum ExceptionSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ExceptionCloseType
{
    NormalClose = 1,
    SupplementRequired = 2,
    Escalation = 3
}

public enum ExceptionStatus
{
    Reported = 0,
    Investigating = 10,
    Handling = 20,
    PendingSupplement = 25,
    Escalated = 30,
    Resolved = 50,
    ClosedNormal = 60,
    ClosedWithSupplement = 65,
    ClosedEscalated = 70
}

public enum ReviewType
{
    ScheduleReview = 1,
    ExceptionReview = 2,
    PostProcessReview = 3
}

public enum ReviewResult
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    ConditionalApproved = 3
}

public enum SourceType
{
    SelfRegistration = 1,
    HospitalReferral = 2,
    CommunityReferral = 3,
    FamilyIntroduction = 4,
    OnlineBooking = 5,
    Other = 99
}

public enum CareStandard
{
    NotEvaluated = 0,
    BelowStandard = 1,
    MeetsStandard = 2,
    ExceedsStandard = 3
}
