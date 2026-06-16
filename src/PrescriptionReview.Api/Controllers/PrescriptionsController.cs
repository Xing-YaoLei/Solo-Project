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
public class PrescriptionsController : BaseController
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResult<PrescriptionDto>>> GetList([FromQuery] PrescriptionQueryDto query)
    {
        return await _prescriptionService.GetPagedListAsync(query, CurrentUserId);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<PrescriptionDetailDto>> GetById(int id)
    {
        return await _prescriptionService.GetByIdAsync(id);
    }

    [HttpPost]
    [Authorize(Roles = "Cashier,StoreManager")]
    public async Task<ApiResult<PrescriptionDto>> Create([FromBody] PrescriptionCreateDto dto)
    {
        return await _prescriptionService.CreateAsync(dto, CurrentUserId);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Cashier,StoreManager")]
    public async Task<ApiResult> Update(int id, [FromBody] PrescriptionUpdateDto dto)
    {
        return await _prescriptionService.UpdateAsync(id, dto);
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Cashier,StoreManager")]
    public async Task<ApiResult> Submit(int id)
    {
        return await _prescriptionService.SubmitAsync(id, CurrentUserId);
    }

    [HttpPost("{id}/review")]
    [Authorize(Roles = "Pharmacist,StoreManager")]
    public async Task<ApiResult> Review(int id, [FromBody] PrescriptionReviewDto dto)
    {
        return await _prescriptionService.ReviewAsync(id, dto, CurrentUserId);
    }

    [HttpPost("batch-review")]
    [Authorize(Roles = "Pharmacist,StoreManager")]
    public async Task<ApiResult> BatchReview([FromBody] PrescriptionBatchReviewDto dto)
    {
        return await _prescriptionService.BatchReviewAsync(dto, CurrentUserId);
    }

    [HttpPost("{id}/status")]
    [Authorize(Roles = "Pharmacist,StoreManager,Headquarters")]
    public async Task<ApiResult> ChangeStatus(int id, [FromBody] PrescriptionStatusChangeDto dto)
    {
        return await _prescriptionService.ChangeStatusAsync(id, dto, CurrentUserId);
    }

    [HttpPost("{id}/supplement-notes")]
    public async Task<ApiResult> AddSupplementNote(int id, [FromBody] SupplementNoteCreateDto dto)
    {
        return await _prescriptionService.AddSupplementNoteAsync(id, dto, CurrentUserId);
    }
}
