namespace RehabSettlement.Api.Enums;

public enum SettlementStatus
{
    PendingEntry = 1,
    PendingReview = 2,
    ReviewApproved = 3,
    ReviewRejected = 4,
    Processing = 5,
    PendingFinalReview = 6,
    Completed = 7,
    Closed = 8,
    InsuranceRejected = 9,
    SupplementingMaterials = 10,
    Escalated = 11
}

public enum TreatmentStatus
{
    Scheduled = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    NoShow = 5
}

public enum DeviceStatus
{
    Normal = 1,
    Maintenance = 2,
    Faulty = 3,
    Scrapped = 4
}

public enum ExceptionHandleMethod
{
    CloseNormally = 1,
    SupplementMaterials = 2,
    Escalate = 3
}

public enum UserRole
{
    Admin,
    DataEntry,
    Reviewer,
    Processor,
    FinalReviewer,
    Nurse,
    Therapist
}
