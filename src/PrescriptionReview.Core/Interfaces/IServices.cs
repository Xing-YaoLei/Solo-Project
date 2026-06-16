using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Core.Interfaces;

public interface IAuthService
{
    Task<ApiResult<LoginResponse>> LoginAsync(LoginRequest request);
}

public interface IUserService
{
    Task<ApiResult<PagedResult<UserDto>>> GetPagedListAsync(UserQueryDto query);
    Task<ApiResult<UserDto>> GetByIdAsync(int id);
    Task<ApiResult<UserDto>> CreateAsync(UserCreateDto dto);
    Task<ApiResult> UpdateAsync(int id, UserUpdateDto dto);
    Task<ApiResult> DeleteAsync(int id);
}

public interface IPrescriptionService
{
    Task<ApiResult<PagedResult<PrescriptionDto>>> GetPagedListAsync(PrescriptionQueryDto query, int? currentUserId = null);
    Task<ApiResult<PrescriptionDetailDto>> GetByIdAsync(int id);
    Task<ApiResult<PrescriptionDto>> CreateAsync(PrescriptionCreateDto dto, int cashierId);
    Task<ApiResult> UpdateAsync(int id, PrescriptionUpdateDto dto);
    Task<ApiResult> SubmitAsync(int id, int cashierId);
    Task<ApiResult> ReviewAsync(int id, PrescriptionReviewDto dto, int pharmacistId);
    Task<ApiResult> BatchReviewAsync(PrescriptionBatchReviewDto dto, int pharmacistId);
    Task<ApiResult> ChangeStatusAsync(int id, PrescriptionStatusChangeDto dto, int operatorId);
    Task<ApiResult> AddSupplementNoteAsync(int id, SupplementNoteCreateDto dto, int operatorId);
}

public interface IAttachmentService
{
    Task<ApiResult<List<AttachmentDto>>> GetByPrescriptionIdAsync(int prescriptionId);
    Task<ApiResult<AttachmentDto>> UploadAsync(int prescriptionId, AttachmentType type, Stream fileStream, string fileName, string contentType, int uploadedBy);
    Task<ApiResult> DeleteAsync(int id);
}

public interface IRestockOrderService
{
    Task<ApiResult<PagedResult<RestockOrderDto>>> GetPagedListAsync(RestockOrderQueryDto query);
    Task<ApiResult<RestockOrderDetailDto>> GetByIdAsync(int id);
}

public interface IInsuranceRecordService
{
    Task<ApiResult<PagedResult<InsuranceRecordDto>>> GetPagedListAsync(InsuranceRecordQueryDto query);
    Task<ApiResult<InsuranceRecordDto>> GetByIdAsync(int id);
}

public interface IStatisticsService
{
    Task<ApiResult<StatisticsDto>> GetOverviewAsync(StatisticsQueryDto query);
    Task<ApiResult<List<PrescriptionStatisticsDto>>> GetPrescriptionTrendAsync(StatisticsQueryDto query);
    Task<ApiResult<List<StoreStatisticsDto>>> GetStoreStatisticsAsync(StatisticsQueryDto query);
}

public interface IFollowUpService
{
    Task<ApiResult<FollowUpDto>> GetByPrescriptionIdAsync(int prescriptionId);
    Task<ApiResult<FollowUpDto>> CreateAsync(int prescriptionId, FollowUpCreateDto dto, int operatorId);
    Task<ApiResult> UpdateAsync(int id, FollowUpUpdateDto dto, int operatorId);
}

public interface IStoreService
{
    Task<ApiResult<List<StoreDto>>> GetAllAsync();
    Task<ApiResult<PagedResult<StoreDto>>> GetPagedListAsync(StoreQueryDto query);
    Task<ApiResult<StoreDto>> GetByIdAsync(int id);
}
