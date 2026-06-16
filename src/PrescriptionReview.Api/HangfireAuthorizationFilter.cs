using Hangfire.Dashboard;

namespace PrescriptionReview.Api;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly string _username;
    private readonly string _password;

    public HangfireAuthorizationFilter(string username, string password)
    {
        _username = username;
        _password = password;
    }

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            return true;
        }

        var authHeader = httpContext.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic "))
        {
            httpContext.Response.StatusCode = 401;
            httpContext.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Hangfire Dashboard\"";
            return false;
        }

        try
        {
            var credentials = System.Text.Encoding.UTF8.GetString(
                Convert.FromBase64String(authHeader.Substring(6))
            ).Split(':');

            if (credentials.Length == 2 && credentials[0] == _username && credentials[1] == _password)
            {
                return true;
            }
        }
        catch
        {
        }

        httpContext.Response.StatusCode = 401;
        httpContext.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Hangfire Dashboard\"";
        return false;
    }
}
