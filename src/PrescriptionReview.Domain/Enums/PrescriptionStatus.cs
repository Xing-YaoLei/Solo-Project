namespace PrescriptionReview.Domain.Enums;

public enum PrescriptionStatus
{
    Pending = 0,
    Reviewing = 1,
    Approved = 2,
    Rejected = 3,
    Unclear = 4,
    SupplementRequired = 5,
    Completed = 6
}
