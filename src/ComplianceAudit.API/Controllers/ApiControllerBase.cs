using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ComplianceAudit.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    protected long? GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claim, out var id) ? id : null;
    }

    protected int? GetCurrentUserRoleInt()
    {
        var claim = User.FindFirst("Role")?.Value;
        return int.TryParse(claim, out var role) ? role : null;
    }

    protected Core.Enums.AuditRole? GetCurrentUserRole()
    {
        var role = GetCurrentUserRoleInt();
        return role.HasValue ? (Core.Enums.AuditRole)role.Value : null;
    }

    protected IActionResult OkResult<T>(T data, string? message = null)
        => Ok(DTOs.ApiResponse<T>.Ok(data, message));

    protected IActionResult FailResult(string message, string? errorCode = null)
        => Ok(DTOs.ApiResponse<bool>.Fail(message, errorCode));
}
