using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Hangfire;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;
using ComplianceAudit.Infrastructure.Repositories;
using ComplianceAudit.Infrastructure.Services;
using ComplianceAudit.Infrastructure.Hangfire;

namespace ComplianceAudit.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;
        })
        .AddRoles<ApplicationRole>()
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IAuditScheduleService, AuditScheduleService>();
        services.AddScoped<IChecklistService, ChecklistService>();
        services.AddScoped<ISamplingService, SamplingService>();
        services.AddScoped<ICheckRecordService, CheckRecordService>();
        services.AddScoped<IEvidenceMissingService, EvidenceMissingService>();
        services.AddScoped<IRectificationService, RectificationService>();
        services.AddScoped<IEvidenceService, EvidenceService>();
        services.AddScoped<IStatisticsService, StatisticsService>();

        services.AddScoped<IHangfireJobs, HangfireJobs>();

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(connectionString));

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 4;
            options.ServerName = "compliance-audit-server";
        });

        return services;
    }
}
