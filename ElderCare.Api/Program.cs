using ElderCare.Api.Data;
using ElderCare.Api.Jobs;
using ElderCare.Api.Services;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfire(configuration => configuration
    .UseSqlServerStorage(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new SqlServerStorageOptions
        {
            PrepareSchemaIfNecessary = true,
            QueuePollInterval = TimeSpan.FromSeconds(15)
        }));

builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddScoped<IMedicationService, MedicationService>();
builder.Services.AddScoped<IVisitService, VisitService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IElderlyService, ElderlyService>();
builder.Services.AddScoped<IRiskEventService, RiskEventService>();
builder.Services.AddScoped<IQueryService, QueryService>();

var app = builder.Build();

app.UseCors("AllowFrontend");

app.UseHangfireDashboard("/hangfire");

app.UseHangfireServer();

RecurringJob.AddOrUpdate<MedicationReminderJob>(
    "generate-daily-reminders",
    job => job.GenerateDailyReminders(),
    Cron.Daily(6));

RecurringJob.AddOrUpdate<MedicationReminderJob>(
    "check-missed-reminders",
    job => job.CheckMissedReminders(),
    Cron.MinuteInterval(30));

RecurringJob.AddOrUpdate<RiskEventNotificationJob>(
    "process-open-risk-events",
    job => job.ProcessOpenRiskEvents(),
    Cron.MinuteInterval(5));

RecurringJob.AddOrUpdate<RiskEventNotificationJob>(
    "retry-failed-reminders",
    job => job.RetryFailedReminders(),
    Cron.MinuteInterval(15));

app.MapControllers();

app.Run();
