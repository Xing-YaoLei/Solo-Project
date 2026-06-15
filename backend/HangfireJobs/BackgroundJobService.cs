using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.HangfireJobs;

public class BackgroundJobService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundJobService> _logger;

    public BackgroundJobService(IServiceProvider serviceProvider, ILogger<BackgroundJobService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task CheckProgressBehindAsync()
    {
        _logger.LogInformation("开始执行进度落后检测任务 - {Time}", DateTime.Now);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var alertService = scope.ServiceProvider.GetRequiredService<IProgressAlertService>();

            var createdCount = await alertService.CheckAndCreateAlertsAsync();

            _logger.LogInformation("进度落后检测任务完成，新生成 {Count} 条告警", createdCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "进度落后检测任务执行失败");
            throw;
        }
    }

    public async Task GenerateMonthlyReviewAsync(int year, int month)
    {
        _logger.LogInformation("开始生成月度复盘报告：{Year}年{Month}月", year, month);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var reviewService = scope.ServiceProvider.GetRequiredService<IMonthlyReviewService>();

            var certificates = new List<int> { 1, 2 };

            foreach (var certId in certificates)
            {
                var review = await reviewService.GetMonthlyReviewAsync(
                    new MonthlyReviewQueryDto { Year = year, Month = month, CertificateId = certId });

                _logger.LogInformation("证书 {CertId} 月度复盘：完成率 {Rate}%", certId, review.OverallCompletionRate);
            }

            _logger.LogInformation("月度复盘报告生成完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "月度复盘报告生成失败");
            throw;
        }
    }

    public async Task CleanupExpiredExportsAsync()
    {
        _logger.LogInformation("开始清理过期导出文件 - {Time}", DateTime.Now);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();

            var expiredExports = await context.ExportRecords
                .Where(e => e.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync();

            foreach (var export in expiredExports)
            {
                if (!string.IsNullOrEmpty(export.FilePath) && File.Exists(export.FilePath))
                {
                    try
                    {
                        File.Delete(export.FilePath);
                    }
                    catch { }
                }
            }

            context.ExportRecords.RemoveRange(expiredExports);
            await context.SaveChangesAsync();

            _logger.LogInformation("清理了 {Count} 个过期导出文件", expiredExports.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "清理过期导出文件失败");
            throw;
        }
    }
}

public class MonthlyReviewQueryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int? CertificateId { get; set; }
    public int? CourseId { get; set; }
}
