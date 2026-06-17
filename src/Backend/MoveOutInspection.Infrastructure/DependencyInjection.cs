
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MoveOutInspection.Core.Interfaces;
using MoveOutInspection.Infrastructure.Data;
using MoveOutInspection.Infrastructure.Repositories;
using MoveOutInspection.Infrastructure.Services;

namespace MoveOutInspection.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITimelineService, TimelineService>();
        services.AddScoped<IBackgroundJobService, BackgroundJobService>();

        return services;
    }
}
