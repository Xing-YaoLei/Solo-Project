using System.Text.Json;
using System.Text.Json.Serialization;
using Hangfire;
using LegalFeeScheduling.Infrastructure.Data;
using LegalFeeScheduling.Infrastructure.Hangfire.RecurringJobs;
using LegalFeeScheduling.Infrastructure.Repositories;
using LegalFeeScheduling.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "LegalFeeScheduling API", Version = "v1" });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfire(configuration => configuration
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")));
builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IQuoteRepository, QuoteRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IReconciliationRepository, ReconciliationRepository>();
builder.Services.AddScoped<IAmountValidationService, AmountValidationService>();
builder.Services.AddScoped<IQuoteWorkflowService, QuoteWorkflowService>();

builder.Services.AddMemoryCache();

builder.Services.AddTransient<PaymentMonitoringJob>();
builder.Services.AddTransient<ReconciliationReminderJob>();
builder.Services.AddTransient<SummaryStatisticsJob>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHangfireDashboard(builder.Configuration["Hangfire:DashboardPath"] ?? "/hangfire", new DashboardOptions
{
    Authorization = Array.Empty<Hangfire.Dashboard.IDashboardAuthorizationFilter>()
});

RecurringJob.AddOrUpdate<PaymentMonitoringJob>(
    "payment-monitoring",
    job => job.ExecuteAsync(),
    Cron.Daily(0, 0));

RecurringJob.AddOrUpdate<ReconciliationReminderJob>(
    "reconciliation-reminder",
    job => job.ExecuteAsync(),
    Cron.Daily(0, 0));

RecurringJob.AddOrUpdate<SummaryStatisticsJob>(
    "summary-statistics",
    job => job.ExecuteAsync(),
    Cron.Daily(0, 0));

app.MapControllers();

app.Run();
