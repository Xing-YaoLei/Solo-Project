using HearingCalendar.Domain.Common;

namespace HearingCalendar.Domain.Entities;

public class ClientFeedback : BaseEntity
{
    public Guid HearingId { get; set; }
    public Guid ClientId { get; set; }
    public int SatisfactionScore { get; set; }
    public string? Comments { get; set; }
    public DateTime SubmittedAt { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
    public User Client { get; set; } = null!;
}
