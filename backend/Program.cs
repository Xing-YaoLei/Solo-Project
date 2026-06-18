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

builder.Services.AddDbContext<AppointmentDbContext>(options =>
    options.UseSqlServer(connectionString));

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

builder.Services.AddHangfireServer();

builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IQuoteService, QuoteService>();
builder.Services.AddScoped<IInspectionService, InspectionService>();
builder.Services.AddScoped<IPartsService, PartsService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.UseHangfireDashboard();

RecurringJob.AddOrUpdate<PartsInventoryJob>(
    "parts-inventory-check",
    job => job.CheckLowInventoryAsync(),
    Cron.Daily);

RecurringJob.AddOrUpdate<AppointmentReminderJob>(
    "appointment-reminder",
    job => job.SendRemindersAsync(),
    Cron.EveryHour);

RecurringJob.AddOrUpdate<DataCleanupJob>(
    "data-cleanup",
    job => job.CleanupOldDataAsync(),
    Cron.Weekly);

app.Run();
