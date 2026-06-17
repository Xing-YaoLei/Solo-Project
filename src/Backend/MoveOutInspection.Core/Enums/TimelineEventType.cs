
namespace MoveOutInspection.Core.Enums;

public enum TimelineEventType
{
    Created = 0,
    StatusChanged = 1,
    NoteAdded = 2,
    AttachmentUploaded = 3,
    HandlerAssigned = 4,
    HandlerChanged = 5,
    InspectionDone = 6,
    PaymentRecorded = 7,
    UtilityRecorded = 8,
    ComplaintTagged = 9,
    OverdueRecorded = 10,
    ResponsibilityAdjusted = 11,
    CustomAction = 99
}
