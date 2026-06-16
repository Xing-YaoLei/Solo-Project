using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : BaseController
{
    private readonly IAttachmentService _attachmentService;

    public AttachmentsController(IAttachmentService attachmentService)
    {
        _attachmentService = attachmentService;
    }

    [HttpGet("prescription/{prescriptionId}")]
    public async Task<ApiResult<List<AttachmentDto>>> GetByPrescriptionId(int prescriptionId)
    {
        return await _attachmentService.GetByPrescriptionIdAsync(prescriptionId);
    }

    [HttpPost("prescription/{prescriptionId}")]
    public async Task<ApiResult<AttachmentDto>> Upload(int prescriptionId, [FromQuery] AttachmentType type, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return ApiResult<AttachmentDto>.Fail("请选择要上传的文件");
        }

        using var stream = file.OpenReadStream();
        return await _attachmentService.UploadAsync(
            prescriptionId,
            type,
            stream,
            file.FileName,
            file.ContentType,
            CurrentUserId
        );
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Pharmacist,StoreManager,Headquarters")]
    public async Task<ApiResult> Delete(int id)
    {
        return await _attachmentService.DeleteAsync(id);
    }
}
