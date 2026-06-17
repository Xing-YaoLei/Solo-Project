using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Extensions;
using SiteSchedule.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

var hangfireConnectionString = builder.Configuration.GetConnectionString("HangfireConnection");
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(hangfireConnectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));

builder.Services.AddHangfireServer();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IPersonInChargeService, PersonInChargeService>();
builder.Services.AddScoped<ICustomerProfileService, CustomerProfileService>();
builder.Services.AddScoped<IAttachmentMaterialService, AttachmentMaterialService>();
builder.Services.AddScoped<ITagGroupRuleService, TagGroupRuleService>();
builder.Services.AddScoped<IAuthScopeThresholdService, AuthScopeThresholdService>();
builder.Services.AddScoped<IConstructionSiteService, ConstructionSiteService>();
builder.Services.AddScoped<ITimelineChangeService, TimelineChangeService>();
builder.Services.AddScoped<IMaterialSubmissionService, MaterialSubmissionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IActionLogService, ActionLogService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddScoped<HangfireJobRunner>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();

var dashboardPath = builder.Configuration["Hangfire:DashboardPath"] ?? "/hangfire";
var dashboardTitle = builder.Configuration["Hangfire:DashboardTitle"] ?? "Hangfire Dashboard";
app.UseHangfireDashboard(dashboardPath, new DashboardOptions
{
    DashboardTitle = dashboardTitle,
    Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
});

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    
    try
    {
        await context.Database.EnsureCreatedAsync();
        await DbInitializer.InitializeAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "初始化数据库时发生错误");
    }
}

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var jobRunner = services.GetRequiredService<HangfireJobRunner>();
    
    var jobSchedule = builder.Configuration["Hangfire:JobSchedule:MaterialMissingCheck"] ?? "0 */1 * * *";
    RecurringJob.AddOrUpdate(
        "check-material-missing-notifications",
        () => jobRunner.CheckAndSendMaterialMissingNotificationsAsync(),
        jobSchedule,
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });
}

app.Run();
