using Microsoft.Extensions.DependencyInjection;
using ScenicTicketBooking.Application.Jobs;
using ScenicTicketBooking.Application.Services;

namespace ScenicTicketBooking.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IConflictDetectionService, ConflictDetectionService>();
        services.AddScoped<IReminderListService, ReminderListService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IExportService, ExportService>();

        services.AddScoped<IHangfireJobs, HangfireJobs>();

        return services;
    }
}
