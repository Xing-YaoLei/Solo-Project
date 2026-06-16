using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RestockOrdersController : BaseController
{
    private readonly IRestockOrderService _restockOrderService;

    public RestockOrdersController(IRestockOrderService restockOrderService)
    {
        _restockOrderService = restockOrderService;
    }

    [HttpGet]
    public async Task<ApiResult<PagedResult<RestockOrderDto>>> GetList([FromQuery] RestockOrderQueryDto query)
    {
        return await _restockOrderService.GetPagedListAsync(query);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<RestockOrderDetailDto>> GetById(int id)
    {
        return await _restockOrderService.GetByIdAsync(id);
    }
}
