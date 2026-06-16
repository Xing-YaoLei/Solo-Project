using RehabSettlement.Api.Dtos;

namespace RehabSettlement.Api.Services;

public interface ISettlementBillService
{
    Task<PagedResultDto<SettlementBillDto>> GetBillListAsync(BillListQueryDto query);
    Task<SettlementBillDto?> GetBillByIdAsync(int id);
    Task<SettlementBillDetailDto?> GetBillDetailAsync(int id);
    Task<SettlementBillDto> CreateBillAsync(CreateSettlementBillDto dto, int? userId = null);
    Task<SettlementBillDto?> UpdateBillAsync(int id, UpdateSettlementBillDto dto);
    Task<bool> DeleteBillAsync(int id);
    Task<SettlementBillDto?> SubmitBillAsync(int id, int? userId = null);
    Task<SettlementBillDto?> ReviewBillAsync(int id, bool approved, string? remark, int? userId = null);
    Task<SettlementBillDto?> ProcessBillAsync(int id, int? userId = null);
    Task<SettlementBillDto?> FinalReviewBillAsync(int id, bool approved, string? remark, int? userId = null);
    Task<SettlementBillDto?> CloseBillAsync(int id, string? remark, int? userId = null);
    Task<SettlementBillDto?> AssignBillAsync(int id, int assigneeId, int? userId = null);
    Task AddReviewTagsAsync(int billId, List<int> tagIds, int? userId = null);
    Task RemoveReviewTagAsync(int billId, int tagId);
}
