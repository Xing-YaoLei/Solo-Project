namespace CourierVerification.Enums;

public enum VerificationStatus
{
    Pending,
    Assigned,
    InProgress,
    Confirmed,
    Supplemented,
    Closed,
    Cancelled,
    Damaged,
    Overdue
}

public enum VerificationStage
{
    Entry,
    Action,
    Review
}

public enum DamageSeverity
{
    Minor,
    Moderate,
    Major,
    Critical
}

public enum ResponsibleParty
{
    Rider,
    Sender,
    Receiver,
    Platform,
    Undetermined
}

public enum RiderStatus
{
    Active,
    Inactive,
    OnBreak,
    Offline
}

public enum DamageRange
{
    SingleItem,
    PartialPackage,
    EntirePackage,
    MultiplePackages
}

public enum OrderStatus
{
    Pending,
    Assigned,
    PickedUp,
    InTransit,
    Delivered,
    Cancelled
}

public enum PhotoType
{
    Verification,
    Damage,
    Delivery,
    Other
}
