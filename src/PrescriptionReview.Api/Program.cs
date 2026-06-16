using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using PrescriptionReview.Infrastructure;
using PrescriptionReview.Infrastructure.Data;
using PrescriptionReview.Infrastructure.Services;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "处方审核排程台 API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "PrescriptionReviewSecretKeyForJwtToken1234567890";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "PrescriptionReview",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "PrescriptionReview",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireHeadquarters", policy => policy.RequireRole("Headquarters"));
    options.AddPolicy("RequireStoreManager", policy => policy.RequireRole("StoreManager", "Headquarters"));
    options.AddPolicy("RequirePharmacist", policy => policy.RequireRole("Pharmacist", "StoreManager", "Headquarters"));
    options.AddPolicy("RequireCashier", policy => policy.RequireRole("Cashier", "StoreManager", "Pharmacist", "Headquarters"));
});

builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddHangfire(config =>
{
    config.UseSqlServerStorage(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        });
});

builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "处方审核排程台 API v1"));
}

app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter("admin", "admin123") }
});

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

RecurringJob.AddOrUpdate<HangfireJobs>(
    "process-expired-prescriptions",
    job => job.ProcessExpiredPrescriptions(),
    Cron.Daily);

RecurringJob.AddOrUpdate<HangfireJobs>(
    "daily-statistics-summary",
    job => job.DailyStatisticsSummary(),
    Cron.Daily(23, 0));

RecurringJob.AddOrUpdate<HangfireJobs>(
    "follow-up-reminder",
    job => job.FollowUpReminder(),
    Cron.Daily(9, 0));

app.Run();
