using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ApiResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        return await _authService.LoginAsync(request);
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var claims = User.Claims.ToDictionary(c => c.Type, c => c.Value);
        return Ok(ApiResult<object>.Ok(new {
            UserId = claims.GetValueOrDefault(ClaimTypes.NameIdentifier),
            Username = claims.GetValueOrDefault(ClaimTypes.Name),
            Role = claims.GetValueOrDefault(ClaimTypes.Role),
            RealName = claims.GetValueOrDefault("RealName"),
            StoreId = claims.GetValueOrDefault("StoreId")
        }));
    }
}
