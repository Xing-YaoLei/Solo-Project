using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InsuranceRecordsController : BaseController
{
    private readonly IInsuranceRecordService _insuranceRecordService;

    public InsuranceRecordsController(IInsuranceRecordService insuranceRecordService)
    {
        _insuranceRecordService = insuranceRecordService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResult<InsuranceRecordDto>>> GetList([FromQuery] InsuranceRecordQueryDto query)
    {
        return await _insuranceRecordService.GetPagedListAsync(query);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<InsuranceRecordDto>> GetById(int id)
    {
        return await _insuranceRecordService.GetByIdAsync(id);
    }
}
