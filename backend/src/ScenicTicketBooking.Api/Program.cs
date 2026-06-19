using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;
using ScenicTicketBooking.Application;
using ScenicTicketBooking.Application.Jobs;
using ScenicTicketBooking.Infrastructure;
using ScenicTicketBooking.Infrastructure.Data;

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

var hangfireCs = builder.Configuration.GetConnectionString("HangfireConnection")
                 ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(hangfireCs, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true,
        PrepareSchemaIfNecessary = true,
        TryAutoDetectSchemaDependentOptions = true
    }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Math.Min(Environment.ProcessorCount * 5, 20);
    options.SchedulePollingInterval = TimeSpan.FromSeconds(5);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var dbReady = false;
    try
    {
        dbReady = await db.Database.CanConnectAsync();
        if (!dbReady)
        {
            logger.LogWarning("无法连接到 SQL Server，将尝试自动创建数据库...");
            dbReady = await db.Database.EnsureCreatedAsync();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "数据库连接/自动创建失败。请检查 appsettings.json 中 DefaultConnection 连接字符串，" +
                           "确保 LocalDB / SQL Server 实例可用。当前连接：{Connection}",
            builder.Configuration.GetConnectionString("DefaultConnection"));
        dbReady = false;
    }

    if (dbReady)
    {
        try
        {
            await SeedDataInitializer.EnsureDatabaseAndSeedAsync(db);
            logger.LogInformation("数据库种子数据初始化完成。");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "数据库种子数据初始化失败：{Error}", ex.Message);
        }
    }
    else
    {
        logger.LogCritical("数据库不可用。API 将正常启动，但依赖数据库的接口会返回异常。" +
                           "建议使用 Visual Studio / SSMS 启动 LocalDB 后重试。");
    }
}

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
    app.Logger.LogWarning(ex, "Hangfire 定时任务初始化失败，稍后将由仪表板自动重试");
}

app.Run();

public class HangfireDashboardAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        return true;
    }
}
