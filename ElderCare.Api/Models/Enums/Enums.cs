namespace ElderCare.Api.Models.Enums;

public enum MedicationStatus
{
    Active = 0,
    Paused = 1,
    Completed = 2
}

public enum ReminderStatus
{
    Pending = 0,
    Sent = 1,
    Acknowledged = 2,
    Missed = 3
}

public enum RiskEventType
{
    Fall = 0,
    Wander = 1,
    Choking = 2,
    Other = 3
}

public enum RiskEventSeverity
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum ReminderActionType
{
    Pushed = 0,
    Supplemented = 1,
    Retried = 2,
    Closed = 3
}

public enum VisitStatus
{
    Scheduled = 0,
    Completed = 1,
    Missed = 2,
    Cancelled = 3
}

public enum CheckInStatus
{
    CheckedIn = 0,
    Absent = 1,
    Late = 2,
    Excused = 3
}
