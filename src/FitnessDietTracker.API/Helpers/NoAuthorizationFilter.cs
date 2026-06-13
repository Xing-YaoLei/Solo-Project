using Hangfire.Dashboard;

namespace FitnessDietTracker.API.Helpers;

public class NoAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        return true;
    }
}
