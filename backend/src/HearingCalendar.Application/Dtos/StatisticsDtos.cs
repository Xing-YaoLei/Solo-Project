namespace HearingCalendar.Application.Dtos;

public record StatisticsOverviewResponse(
    int TotalHearings,
    int CompletedHearings,
    int CancelledHearings,
    int ConflictsDetected,
    double AvgSatisfactionScore,
    int HearingsThisMonth,
    int HearingsThisWeek);

public record ClientSatisfactionReport(
    Guid ClientId,
    string ClientName,
    double AvgScore,
    int HearingCount,
    List<FeedbackDetail> Feedbacks);

public record FeedbackDetail(
    Guid HearingId,
    string CaseNumber,
    int SatisfactionScore,
    string? Comments,
    DateTime SubmittedAt);

public record HearingStatistics(
    DateOnly Date,
    int Total,
    int Completed,
    int Cancelled,
    int ConflictCount);
