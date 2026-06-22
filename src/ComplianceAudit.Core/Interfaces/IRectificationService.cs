using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IRectificationService
{
    Task<Rectification> CreateRectificationAsync(Rectification rectification, long currentUserId);
    Task<Rectification?> GetRectificationByIdAsync(long id);
    Task<(IEnumerable<Rectification> Items, int TotalCount)> GetRectificationsAsync(
        int pageNumber, int pageSize,
        long? scheduleId, long? ownerId,
        RectificationStatus? status, RiskLevel? riskLevel,
        bool myAssigned, long? currentUserId);
    Task<IEnumerable<Rectification>> GetRectificationsByScheduleIdAsync(long scheduleId);
    Task<Rectification> UpdateRectificationAsync(Rectification rectification, long currentUserId);
    Task UpdateStatusAsync(long id, RectificationStatus status, long currentUserId, string? comments = null);
    Task SubmitForReviewAsync(long id, long currentUserId);
    Task VerifyAsync(long id, string verificationResult, bool isVerified, long currentUserId);
    Task CloseAsync(long id, long currentUserId);
    Task CheckOverdueRectifications();
}
