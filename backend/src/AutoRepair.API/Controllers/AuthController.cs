using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;

namespace AutoRepair.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _authService.LoginAsync(dto);
        if (user == null)
        {
            return Unauthorized(new { message = "邮箱或密码错误" });
        }
        return Ok(user);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    [HttpGet("technicians")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetTechnicians()
    {
        var technicians = await _authService.GetAllTechniciansAsync();
        return Ok(technicians);
    }
}
