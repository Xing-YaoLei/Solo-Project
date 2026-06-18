using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AutoRepair.Application.Interfaces;
using AutoRepair.Application.Services;
using AutoRepair.Application.Jobs;

namespace AutoRepair.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(typeof(DependencyInjection).Assembly));

        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IWorkOrderService, WorkOrderService>();
        services.AddScoped<IDiagnosisService, DiagnosisService>();
        services.AddScoped<IPartService, PartService>();
        services.AddScoped<IStockAlertService, StockAlertService>();
        services.AddScoped<IQuoteService, QuoteService>();
        services.AddScoped<IReviewOpinionService, ReviewOpinionService>();
        services.AddScoped<ICommunicationLogService, CommunicationLogService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<IJobScheduler, JobScheduler>();
        services.AddScoped<StockCheckJob>();
        services.AddScoped<MaintenanceReminderJob>();
        services.AddScoped<DailyScheduleJob>();

        return services;
    }
}
