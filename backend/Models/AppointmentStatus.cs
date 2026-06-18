namespace CarServiceAppointment.API.Models;

public enum AppointmentStatus
{
    Pending = 0,
    InService = 1,
    PartsShortage = 2,
    DataIncomplete = 3,
    ReviewRequired = 4,
    Completed = 5,
    Closed = 6
}
