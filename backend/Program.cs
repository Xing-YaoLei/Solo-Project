using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.Services;
using CarServiceAppointment.API.BackgroundJobs;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "汽车维修预约进厂排程台 API",
        Version = "v1",
        Description = "汽车维修预约进厂排程台系统后端API — 预约单、车辆档案、报价单、质检照片、配件库存、统计汇总"
    });
    c.EnableAnnotations();
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

var env = builder.Environment;
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var hasSqlServer = !string.IsNullOrEmpty(connectionString);

var useInMemory = env.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("UseInMemoryDatabase", false) ||
    !hasSqlServer;

if (useInMemory)
{
    builder.Services.AddDbContext<AppointmentDbContext>(options =>
        options.UseInMemoryDatabase("CarServiceAppointmentDb"));
    builder.Logging.AddConsole();
}
else
{
    builder.Services.AddDbContext<AppointmentDbContext>(options =>
        options.UseSqlServer(connectionString ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")));
}

var useHangfireMemory = useInMemory ||
    builder.Configuration.GetValue<bool>("Hangfire:UseMemoryStorage", false);

if (useHangfireMemory)
{
    builder.Services.AddHangfire(configuration => configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseInMemoryStorage());
    builder.Services.AddHangfireServer(options =>
    {
        options.SchedulePollingInterval = TimeSpan.FromSeconds(5);
        options.WorkerCount = 1;
    });
    builder.Services.AddLogging();
}
else if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddHangfire(configuration => configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true,
            PrepareSchemaIfNecessary = true
        }));

    builder.Services.AddHangfireServer(options =>
    {
        options.SchedulePollingInterval = TimeSpan.FromSeconds(15);
    });
}

builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IQuoteService, QuoteService>();
builder.Services.AddScoped<IInspectionService, InspectionService>();
builder.Services.AddScoped<IPartsService, PartsService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();

var app = builder.Build();

if (useInMemory)
{
    using (var scope = app.Services.CreateScope())
    {
        var ctx = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
        await ctx.Database.EnsureCreatedAsync();
        await AppointmentDbContext.SeedAsync(ctx);
        app.Logger.LogInformation("内存数据库已初始化并填充种子数据");
    }
}
else
{
    using (var scope = app.Services.CreateScope())
    {
        var ctx = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
        try
        {
            await ctx.Database.MigrateAsync();
            app.Logger.LogInformation("SQL Server 数据库迁移完成");
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "SQL Server 迁移失败，跳过（请手动执行 dotnet ef database update）");
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "汽车维修预约进厂排程台 API v1");
        c.DisplayOperationId();
        c.DisplayRequestDuration();
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

if (useHangfireMemory || !string.IsNullOrEmpty(connectionString))
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        DashboardTitle = "汽车维修排程台 - Hangfire",
        IgnoreAntiforgeryToken = true
    });

    try
    {
        var jobOptions = new RecurringJobOptions
        {
            TimeZone = TimeZoneInfo.Local
        };

        RecurringJob.AddOrUpdate<PartsInventoryJob>(
            "parts-inventory-check",
            job => job.CheckLowInventoryAsync(),
            Cron.Daily(3, 0),
            jobOptions);

        RecurringJob.AddOrUpdate<AppointmentReminderJob>(
            "appointment-reminder",
            job => job.SendRemindersAsync(),
            "0 * * * *",
            jobOptions);

        RecurringJob.AddOrUpdate<DataCleanupJob>(
            "data-cleanup",
            job => job.CleanupOldDataAsync(),
            Cron.Weekly(DayOfWeek.Sunday, 2, 0),
            jobOptions);

        app.Logger.LogInformation("Hangfire 周期任务注册成功：库存检查(每天03:00)、预约提醒(每小时整点)、数据清理(每周日02:00)");
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Hangfire 周期任务注册失败，但应用会继续启动。重启应用可重试。");
    }
}

app.MapGet("/", () => new
{
    Name = "汽车维修预约进厂排程台 API",
    Version = "v1",
    Swagger = "/swagger",
    Hangfire = "/hangfire",
    Endpoints = new[]
    {
        "/api/appointments",
        "/api/appointments/list",
        "/api/vehicles",
        "/api/parts",
        "/api/quotes",
        "/api/inspection",
        "/api/statistics/overview"
    }
}).WithName("Root");

var urls = app.Urls;
if (!urls.Any())
{
    app.Urls.Add("http://localhost:5000");
}

app.Logger.LogInformation("应用启动完成：");
app.Logger.LogInformation("  Swagger UI    → http://localhost:5000/swagger");
app.Logger.LogInformation("  Hangfire 面板 → http://localhost:5000/hangfire");
app.Logger.LogInformation("  数据存储      → {Storage}", useInMemory ? "InMemory (开发模式)" : "SQL Server");
app.Logger.LogInformation("  Hangfire 存储 → {HangfireStorage}", useHangfireMemory ? "InMemory (开发模式)" : "SQL Server");

app.Run();
