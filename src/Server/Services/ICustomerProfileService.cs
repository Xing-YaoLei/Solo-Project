using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.CustomerProfile;

namespace SiteSchedule.Services;

public interface ICustomerProfileService
{
    Task<PagedResult<CustomerProfileDto>> GetPagedListAsync(CustomerProfileQueryDto query);
    Task<CustomerProfileDto?> GetByIdAsync(int id);
    Task<CustomerProfileDto> CreateAsync(CustomerProfileCreateDto dto);
    Task<CustomerProfileDto> UpdateAsync(CustomerProfileUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<CustomerProfileDto>> GetAllAsync();
}
