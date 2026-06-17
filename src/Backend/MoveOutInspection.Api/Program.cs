
using Hangfire;
using Microsoft.EntityFrameworkCore;
using MoveOutInspection.Infrastructure;
using MoveOutInspection.Infrastructure.Data;
using MoveOutInspection.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "长租公寓退租验房排程台 API",
        Version = "v1",
        Description = "长租公寓退租验房流程管理系统 API 文档"
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")));
builder.Services.AddHangfireServer();

var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries)
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();

app.MapControllers();

app.UseHangfireDashboard("/hangfire");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "创建数据库时发生错误");
    }
}

RecurringJob.AddOrUpdate<IBackgroundJobService>(
    "check-overdue-todos",
    service => service.CheckOverdueTodosAsync(),
    Cron.Hourly);

RecurringJob.AddOrUpdate<IBackgroundJobService>(
    "check-overdue-rent",
    service => service.CheckOverdueRentAsync(),
    Cron.Daily(6, 0));

app.Run();
