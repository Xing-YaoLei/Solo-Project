using HearingCalendar.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace HearingCalendar.API.Security;

public class RoleAuthorizeAttribute : AuthorizeAttribute
{
    public RoleAuthorizeAttribute(params UserRole[] roles) : base()
    {
        Roles = string.Join(",", roles.Select(r => r.ToString()));
    }
}
