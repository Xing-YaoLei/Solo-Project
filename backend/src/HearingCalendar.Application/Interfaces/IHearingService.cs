using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Helpers;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Interfaces;

public interface IHearingService
{
    Task<HearingDetailResponse> GetByIdAsync(Guid id);
    Task<PagedResult<HearingListResponse>> GetListAsync(int page, int pageSize, HearingStatus? status = null, DateOnly? fromDate = null, DateOnly? toDate = null, string? courtRoom = null, bool? conflictFlagged = null);
    Task<HearingDetailResponse> CreateAsync(CreateHearingRequest request, Guid userId);
    Task<HearingDetailResponse> UpdateAsync(Guid id, UpdateHearingRequest request, Guid userId);
    Task ChangeStatusAsync(Guid id, HearingStatus newStatus, Guid userId, string? reason = null, Guid? relatedAttachmentId = null);
    Task BatchChangeStatusAsync(BatchStatusUpdateRequest request, Guid userId);
    Task DeleteAsync(Guid id, Guid userId);
    Task<IEnumerable<CalendarSlotResponse>> GetAvailableSlotsAsync(DateOnly date, string courtRoom);
}
