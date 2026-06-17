using SiteSchedule.Dtos.AttachmentMaterial;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public interface IAttachmentMaterialService
{
    Task<PagedResult<AttachmentMaterialDto>> GetPagedListAsync(AttachmentMaterialQueryDto query);
    Task<AttachmentMaterialDto?> GetByIdAsync(int id);
    Task<AttachmentMaterialDto> CreateAsync(AttachmentMaterialCreateDto dto);
    Task<AttachmentMaterialDto> UpdateAsync(AttachmentMaterialUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<AttachmentMaterialDto>> GetAllAsync();
    Task<List<AttachmentMaterialDto>> GetByCategoryAsync(MaterialCategory category);
}
