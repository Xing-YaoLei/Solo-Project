using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowUpsController : BaseController
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet("prescription/{prescriptionId}")]
    public async Task<ApiResult<FollowUpDto>> GetByPrescriptionId(int prescriptionId)
    {
        return await _followUpService.GetByPrescriptionIdAsync(prescriptionId);
    }

    [HttpPost("prescription/{prescriptionId}")]
    [Authorize(Roles = "Pharmacist,StoreManager")]
    public async Task<ApiResult<FollowUpDto>> Create(int prescriptionId, [FromBody] FollowUpCreateDto dto)
    {
        return await _followUpService.CreateAsync(prescriptionId, dto, CurrentUserId);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Pharmacist,StoreManager")]
    public async Task<ApiResult> Update(int id, [FromBody] FollowUpUpdateDto dto)
    {
        return await _followUpService.UpdateAsync(id, dto, CurrentUserId);
    }
}
