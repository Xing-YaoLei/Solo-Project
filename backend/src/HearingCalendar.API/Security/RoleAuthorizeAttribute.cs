using HearingCalendar.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace HearingCalendar.API.Security;

public class RoleAuthorizeAttribute : AuthorizeAttribute
{
    public const string Lawyer = nameof(UserRole.Lawyer);
    public const string Assistant = nameof(UserRole.Assistant);
    public const string Partner = nameof(UserRole.Partner);
    public const string Client = nameof(UserRole.Client);

    public RoleAuthorizeAttribute(UserRole role) : base()
    {
        Policy = role.ToString();
    }
}
