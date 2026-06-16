using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BaseController : ControllerBase
{
    protected int CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return 0;
        }
    }

    protected string? CurrentUserName => User.FindFirst(ClaimTypes.Name)?.Value;

    protected string? CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value;
}
