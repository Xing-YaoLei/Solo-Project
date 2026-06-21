using HearingCalendar.Application.Interfaces;
using HearingCalendar.Application.Services;
using HearingCalendar.Infrastructure.Data;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HearingCalendar.API.Configuration;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IHearingService, HearingService>();
        services.AddScoped<IParticipantService, ParticipantService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IConflictService, ConflictService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IReminderService, ReminderService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<AuditTrailRepository>();

        services.AddDbContext<HearingCalendarDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}
