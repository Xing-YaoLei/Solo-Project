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
        Description = "汽车维修预约进厂排程台系统后端API"
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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var isHangfireEnabled = builder.Configuration.GetValue<bool>("Hangfire:Enabled", true)
    && !string.IsNullOrEmpty(connectionString);

builder.Services.AddDbContext<AppointmentDbContext>(options =>
    options.UseSqlServer(connectionString ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")));

if (isHangfireEnabled)
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "汽车维修预约进厂排程台 API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

if (isHangfireEnabled)
{
    app.UseHangfireDashboard("/hangfire");

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
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Hangfire 周期任务注册失败（SQL Server 可能尚未就绪），但应用会继续启动。手动触发任务或重启应用即可重试。");
    }
}

app.Run();
