using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/query")]
public class CombinedQueryController : ControllerBase
{
    private readonly IQueryService _service;

    public CombinedQueryController(IQueryService service)
    {
        _service = service;
    }

    [HttpPost("combined")]
    public async Task<ActionResult<PagedResult<object>>> CombinedQuery([FromBody] CombinedQueryDto query)
    {
        var result = await _service.CombinedQueryAsync(query);
        return Ok(result);
    }
}
