using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StoresController : BaseController
{
    private readonly IStoreService _storeService;

    public StoresController(IStoreService storeService)
    {
        _storeService = storeService;
    }

    [HttpGet]
    public async Task<ApiResult<List<StoreDto>>> GetAll()
    {
        return await _storeService.GetAllAsync();
    }

    [HttpGet("paged")]
    [Authorize(Roles = "Headquarters")]
    public async Task<ApiResult<PagedResult<StoreDto>>> GetPagedList([FromQuery] StoreQueryDto query)
    {
        return await _storeService.GetPagedListAsync(query);
    }

    [HttpGet("{id}")]
    public async Task<ApiResult<StoreDto>> GetById(int id)
    {
        return await _storeService.GetByIdAsync(id);
    }
}
