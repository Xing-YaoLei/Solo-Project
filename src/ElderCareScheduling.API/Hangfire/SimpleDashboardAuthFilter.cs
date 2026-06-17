using Hangfire.Dashboard;
using System.Text;

namespace ElderCareScheduling.API.Hangfire;

public class SimpleDashboardAuthFilter : IDashboardAuthorizationFilter
{
    private readonly string _username;
    private readonly string _password;

    public SimpleDashboardAuthFilter(string username, string password)
    {
        _username = username ?? throw new ArgumentNullException(nameof(username));
        _password = password ?? throw new ArgumentNullException(nameof(password));
    }

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            return true;
        }

        var header = httpContext.Request.Headers["Authorization"].ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            return Challenge(httpContext);
        }

        try
        {
            var credentials = Encoding.UTF8.GetString(Convert.FromBase64String(header.Substring(6)));
            var separatorIndex = credentials.IndexOf(':');

            if (separatorIndex < 0)
            {
                return Challenge(httpContext);
            }

            var providedUsername = credentials.Substring(0, separatorIndex);
            var providedPassword = credentials.Substring(separatorIndex + 1);

            if (string.Equals(providedUsername, _username, StringComparison.Ordinal)
                && string.Equals(providedPassword, _password, StringComparison.Ordinal))
            {
                return true;
            }

            return Challenge(httpContext);
        }
        catch
        {
            return Challenge(httpContext);
        }
    }

    private static bool Challenge(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Hangfire Dashboard\"";
        return false;
    }
}

public class NoopDashboardAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        return true;
    }
}
