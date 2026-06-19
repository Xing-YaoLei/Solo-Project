using Hangfire;
using Hangfire.SqlServer;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;
using ScenicTicketBooking.Application;
using ScenicTicketBooking.Application.Jobs;
using ScenicTicketBooking.Infrastructure;

ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "景区运营门票预约排程台 API",
        Version = "v1",
        Description = "ASP.NET Core + React + SQL Server + Hangfire 景区门票预约管理系统"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")
        ?? builder.Configuration.GetConnectionString("DefaultConnection"), new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Math.Min(Environment.ProcessorCount * 5, 20);
    options.SchedulePollingInterval = TimeSpan.FromSeconds(5);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "景区预约系统 API v1");
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "Hangfire - 景区运营任务面板",
    Authorization = new[] { new HangfireDashboardAuthorizationFilter() }
});

app.MapControllers();
app.MapFallbackToFile("index.html");

try
{
    HangfireJobScheduler.ScheduleRecurringJobs();
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Hangfire 定时任务初始化失败，稍后将重试");
}

app.Run();

public class HangfireDashboardAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        return true;
    }
}
