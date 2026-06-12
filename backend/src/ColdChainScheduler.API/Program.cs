using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using ColdChainScheduler.Infrastructure.Repositories;
using ColdChainScheduler.Infrastructure.Services;
using ColdChainScheduler.Jobs;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfire(configuration => configuration
    .UseSqlServerStorage(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = builder.Configuration.GetValue<int>("Hangfire:WorkerCount", 5);
});

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IStatusChangeLogService, StatusChangeLogService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<UncollectedOrderJob>();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "冷链商品排程平台 API",
        Version = "v1"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();
        dbContext.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var loggerFactory = services.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("Program");
        logger.LogError(ex, "数据库初始化失败");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "冷链商品排程平台 API v1"));
}

app.UseHangfireDashboard(builder.Configuration.GetValue<string>("Hangfire:DashboardPath") ?? "/hangfire");
app.UseHangfireServer();

RecurringJob.AddOrUpdate<UncollectedOrderJob>(
    "uncollected-order-check",
    job => job.ExecuteAsync(),
    Cron.Hourly);

app.UseCors("AllowAll");
app.MapControllers();

app.Run();
