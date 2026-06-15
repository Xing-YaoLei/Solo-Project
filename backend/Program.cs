using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.HangfireJobs;
using CertSchedulePlatform.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<ILearningProgressService, LearningProgressService>();
builder.Services.AddScoped<IProgressAlertService, ProgressAlertService>();
builder.Services.AddScoped<IMonthlyReviewService, MonthlyReviewService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<BackgroundJobService>();

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection"), new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));

builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllers();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "证书考试排程台 - 后台任务"
});

app.MapHangfireDashboard();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (dbContext.Database.IsSqlServer())
        {
            await dbContext.Database.EnsureCreatedAsync();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "数据库初始化失败，请确保 SQL Server 已启动");
    }
}

var appSettings = builder.Configuration.GetSection("AppSettings");
var progressCheckCron = appSettings["ProgressCheckCron"] ?? "0 */6 * * *";
var monthlyReviewCron = appSettings["MonthlyReviewCron"] ?? "0 9 1 * *";

RecurringJob.AddOrUpdate<BackgroundJobService>(
    "check-progress-behind",
    job => job.CheckProgressBehindAsync(),
    progressCheckCron);

RecurringJob.AddOrUpdate<BackgroundJobService>(
    "cleanup-expired-exports",
    job => job.CleanupExpiredExportsAsync(),
    "0 2 * * *");

app.Run();
