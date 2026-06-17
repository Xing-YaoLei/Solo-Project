using ElderCareScheduling.API.Data;
using ElderCareScheduling.API.Hangfire;
using ElderCareScheduling.API.Repositories;
using ElderCareScheduling.API.Services;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "养老护理床位排班排程台 API",
        Version = "v1",
        Description = "养老护理床位排班、审核、处理、复盘全流程管理系统"
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, b => b.MigrationsAssembly("ElderCareScheduling.API")));

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
        DisableGlobalLocks = true
    }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5;
    options.SchedulePollingInterval = TimeSpan.FromSeconds(15);
});

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IElderRepository, ElderRepository>();
builder.Services.AddScoped<IBedRepository, BedRepository>();
builder.Services.AddScoped<ICareLevelRepository, CareLevelRepository>();
builder.Services.AddScoped<IMedicationRepository, MedicationRepository>();
builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();
builder.Services.AddScoped<IExceptionRecordRepository, ExceptionRecordRepository>();
builder.Services.AddScoped<IReviewRecordRepository, ReviewRecordRepository>();

builder.Services.AddScoped<IElderService, ElderService>();
builder.Services.AddScoped<IBedService, BedService>();
builder.Services.AddScoped<ICareLevelService, CareLevelService>();
builder.Services.AddScoped<IMedicationService, MedicationService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IExceptionRecordService, ExceptionRecordService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<IHangfireJobService, HangfireJobService>();

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "养老护理床位排班排程台 API v1");
    });
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "养老护理排班后台任务管理",
    Authorization = new Hangfire.Dashboard.IDashboardAuthorizationFilter[]
    {
        app.Environment.IsDevelopment()
            ? (Hangfire.Dashboard.IDashboardAuthorizationFilter)new NoopDashboardAuthFilter()
            : new SimpleDashboardAuthFilter("admin", "Admin@123")
    }
});

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    try
    {
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "数据库初始化失败");
    }

    var jobService = services.GetRequiredService<IHangfireJobService>();
    jobService.RegisterRecurringJobs();
}

app.Run();
