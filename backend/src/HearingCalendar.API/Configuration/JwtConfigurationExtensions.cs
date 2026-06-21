using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.API.Configuration;

public static class JwtConfigurationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
        var issuer = configuration["Jwt:Issuer"] ?? "HearingCalendar";
        var audience = configuration["Jwt:Audience"] ?? "HearingCalendarUsers";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(UserRole.Lawyer.ToString(), policy => policy.RequireRole(UserRole.Lawyer.ToString()))
            .AddPolicy(UserRole.Assistant.ToString(), policy => policy.RequireRole(UserRole.Assistant.ToString()))
            .AddPolicy(UserRole.Partner.ToString(), policy => policy.RequireRole(UserRole.Partner.ToString()))
            .AddPolicy(UserRole.Client.ToString(), policy => policy.RequireRole(UserRole.Client.ToString()));

        return services;
    }
}
