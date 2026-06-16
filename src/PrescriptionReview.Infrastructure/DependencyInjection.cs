using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Infrastructure.Data;
using PrescriptionReview.Infrastructure.Services;

namespace PrescriptionReview.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemoryStr = configuration["UseInMemoryDatabase"]?.ToLower();
        var useSqliteStr = configuration["UseSqlite"]?.ToLower();
        var useInMemory = useInMemoryStr == "true" || useInMemoryStr == "1";
        var useSqlite = useSqliteStr == "true" || useSqliteStr == "1";

        if (useInMemory)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("PrescriptionReview"));
        }
        else if (useSqlite)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite("Data Source=PrescriptionReview.db"));
        }
        else
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
        }

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IPrescriptionService, PrescriptionService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IRestockOrderService, RestockOrderService>();
        services.AddScoped<IInsuranceRecordService, InsuranceRecordService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IFollowUpService, FollowUpService>();
        services.AddScoped<IStoreService, StoreService>();

        return services;
    }
}
