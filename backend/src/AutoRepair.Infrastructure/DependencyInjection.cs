using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using AutoRepair.Application.Interfaces;
using AutoRepair.Application.Services;
using AutoRepair.Domain.Entities;
using AutoRepair.Infrastructure.Data;

namespace AutoRepair.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        services.AddIdentityCore<AppUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.User.RequireUniqueEmail = true;
        })
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddSignInManager()
        .AddDefaultTokenProviders();

        services.AddAuthorizationBuilder()
            .AddPolicy("RequireManager", policy => policy.RequireRole("Manager"))
            .AddPolicy("RequireTechnician", policy => policy.RequireRole("Technician", "Manager"));

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

        return services;
    }
}
