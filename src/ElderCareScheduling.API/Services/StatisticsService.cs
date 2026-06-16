using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;

    public StatisticsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StatisticsDto> GetOverviewStatisticsAsync(StatisticsQueryDto query)
    {
        var statistics = new StatisticsDto();

        statistics.ScheduleStatistics = await GetScheduleStatisticsAsync(query);
        statistics.ExceptionStatistics = await GetExceptionStatisticsAsync(query);
        statistics.CareStandardStatistics = await GetCareStandardStatisticsAsync(query);
        statistics.SourceStatistics = await GetSourceStatisticsAsync(query);
        statistics.HandlerStatistics = await GetHandlerStatisticsAsync(query);
        statistics.ExceptionCauseStatistics = await GetExceptionCauseStatisticsAsync(query);

        return statistics;
    }

    private async Task<ScheduleStatisticsDto> GetScheduleStatisticsAsync(StatisticsQueryDto query)
    {
        var allSchedules = await _unitOfWork.Schedules.GetAllAsync();
        var schedules = allSchedules.AsQueryable();

        if (query.StartDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt <= query.EndDate.Value);
        if (query.CareLevelId.HasValue)
            schedules = schedules.Where(s => s.CareLevelId == query.CareLevelId.Value);

        var scheduleList = schedules.ToList();
        var totalCount = scheduleList.Count;

        var result = new ScheduleStatisticsDto
        {
            TotalCount = totalCount,
            DraftCount = scheduleList.Count(s => s.Status == ScheduleStatus.Draft),
            UnderReviewCount = scheduleList.Count(s =>
                s.Status == ScheduleStatus.Submitted ||
                s.Status == ScheduleStatus.UnderReview ||
                s.Status == ScheduleStatus.ReviewApproved ||
                s.Status == ScheduleStatus.ReviewRejected),
            InProgressCount = scheduleList.Count(s =>
                s.Status == ScheduleStatus.InProgress ||
                s.Status == ScheduleStatus.Processing),
            ExceptionOccurredCount = scheduleList.Count(s => s.Status == ScheduleStatus.ExceptionOccurred),
            CompletedCount = scheduleList.Count(s => s.Status == ScheduleStatus.Completed),
            ClosedCount = scheduleList.Count(s =>
                s.Status == ScheduleStatus.UnderReviewPost ||
                s.Status == ScheduleStatus.Reviewed ||
                s.Status == ScheduleStatus.Closed ||
                s.Status == ScheduleStatus.Archived)
        };

        var allStatuses = Enum.GetValues<ScheduleStatus>();
        foreach (var status in allStatuses)
        {
            var count = scheduleList.Count(s => s.Status == status);
            result.StatusBreakdown.Add(new ScheduleStatusCountItem
            {
                Status = status,
                StatusText = EnumHelper.GetScheduleStatusText(status),
                Count = count,
                Percentage = totalCount > 0 ? Math.Round((decimal)count / totalCount * 100, 2) : 0
            });
        }

        if (scheduleList.Any())
        {
            var minDate = scheduleList.Min(s => s.CreatedAt.Date);
            var maxDate = scheduleList.Max(s => s.CreatedAt.Date);
            var days = (maxDate - minDate).Days + 1;
            days = Math.Min(days, 30);
            var startDate = maxDate.AddDays(-days + 1);

            for (var d = startDate.Date; d <= maxDate.Date; d = d.AddDays(1))
            {
                var count = scheduleList.Count(s => s.CreatedAt.Date == d);
                result.DailyTrend.Add(new DailyScheduleCountItem
                {
                    Date = d,
                    Count = count
                });
            }
        }

        return result;
    }

    private async Task<ExceptionStatisticsDto> GetExceptionStatisticsAsync(StatisticsQueryDto query)
    {
        var allExceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();
        var exceptions = allExceptions.AsQueryable();

        if (query.StartDate.HasValue)
            exceptions = exceptions.Where(e => e.OccurredAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            exceptions = exceptions.Where(e => e.OccurredAt <= query.EndDate.Value);

        var exceptionList = exceptions.ToList();
        var totalCount = exceptionList.Count;

        var result = new ExceptionStatisticsDto
        {
            TotalCount = totalCount,
            FallCount = exceptionList.Count(e => e.ExceptionType == ExceptionType.Fall),
            OpenCount = exceptionList.Count(e =>
                e.Status != ExceptionStatus.ClosedNormal &&
                e.Status != ExceptionStatus.ClosedWithSupplement &&
                e.Status != ExceptionStatus.ClosedEscalated),
            ClosedNormalCount = exceptionList.Count(e => e.Status == ExceptionStatus.ClosedNormal),
            ClosedWithSupplementCount = exceptionList.Count(e => e.Status == ExceptionStatus.ClosedWithSupplement),
            ClosedEscalatedCount = exceptionList.Count(e => e.Status == ExceptionStatus.ClosedEscalated)
        };

        var allSeverities = Enum.GetValues<ExceptionSeverity>();
        foreach (var severity in allSeverities)
        {
            var count = exceptionList.Count(e => e.Severity == severity);
            result.SeverityBreakdown.Add(new ExceptionSeverityCountItem
            {
                Severity = severity,
                SeverityText = EnumHelper.GetExceptionSeverityText(severity),
                Count = count,
                Percentage = totalCount > 0 ? Math.Round((decimal)count / totalCount * 100, 2) : 0
            });
        }

        var allTypes = Enum.GetValues<ExceptionType>();
        foreach (var type in allTypes)
        {
            var count = exceptionList.Count(e => e.ExceptionType == type);
            result.TypeBreakdown.Add(new ExceptionTypeCountItem
            {
                Type = type,
                TypeText = EnumHelper.GetExceptionTypeText(type),
                Count = count,
                Percentage = totalCount > 0 ? Math.Round((decimal)count / totalCount * 100, 2) : 0
            });
        }

        if (exceptionList.Any())
        {
            var minDate = exceptionList.Min(e => e.OccurredAt.Date);
            var maxDate = exceptionList.Max(e => e.OccurredAt.Date);
            var days = (maxDate - minDate).Days + 1;
            days = Math.Min(days, 30);
            var startDate = maxDate.AddDays(-days + 1);

            for (var d = startDate.Date; d <= maxDate.Date; d = d.AddDays(1))
            {
                var count = exceptionList.Count(e => e.OccurredAt.Date == d);
                result.DailyTrend.Add(new DailyExceptionCountItem
                {
                    Date = d,
                    Count = count
                });
            }
        }

        return result;
    }

    private async Task<CareStandardStatisticsDto> GetCareStandardStatisticsAsync(StatisticsQueryDto query)
    {
        var allSchedules = await _unitOfWork.Schedules.GetAllAsync();
        var schedules = allSchedules.AsQueryable();

        if (query.StartDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt <= query.EndDate.Value);
        if (query.CareLevelId.HasValue)
            schedules = schedules.Where(s => s.CareLevelId == query.CareLevelId.Value);

        var evaluatedList = schedules
            .Where(s => s.CareStandard != CareStandard.NotEvaluated)
            .ToList();

        var totalEvaluated = evaluatedList.Count;

        var result = new CareStandardStatisticsDto
        {
            TotalEvaluated = totalEvaluated,
            BelowStandardCount = evaluatedList.Count(s => s.CareStandard == CareStandard.BelowStandard),
            MeetsStandardCount = evaluatedList.Count(s => s.CareStandard == CareStandard.MeetsStandard),
            ExceedsStandardCount = evaluatedList.Count(s => s.CareStandard == CareStandard.ExceedsStandard)
        };

        var standards = new[] { CareStandard.BelowStandard, CareStandard.MeetsStandard, CareStandard.ExceedsStandard };
        foreach (var standard in standards)
        {
            var count = evaluatedList.Count(s => s.CareStandard == standard);
            result.Breakdown.Add(new CareStandardCountItem
            {
                Standard = standard,
                StandardText = EnumHelper.GetCareStandardText(standard),
                Count = count,
                Percentage = totalEvaluated > 0 ? Math.Round((decimal)count / totalEvaluated * 100, 2) : 0
            });
        }

        return result;
    }

    private async Task<SourceStatisticsDto> GetSourceStatisticsAsync(StatisticsQueryDto query)
    {
        var allElders = await _unitOfWork.Elders.GetAllAsync();
        var elders = allElders.AsQueryable();

        var elderList = elders.ToList();
        var totalElders = elderList.Count;

        var result = new SourceStatisticsDto
        {
            TotalElders = totalElders
        };

        var allSources = Enum.GetValues<SourceType>();
        foreach (var source in allSources)
        {
            var count = elderList.Count(e => e.SourceType == source);
            result.Breakdown.Add(new SourceCountItem
            {
                Source = source,
                SourceText = EnumHelper.GetSourceTypeText(source),
                Count = count,
                Percentage = totalElders > 0 ? Math.Round((decimal)count / totalElders * 100, 2) : 0
            });
        }

        return result;
    }

    private async Task<HandlerStatisticsDto> GetHandlerStatisticsAsync(StatisticsQueryDto query)
    {
        var result = new HandlerStatisticsDto();

        var allExceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();
        var exceptions = allExceptions.AsQueryable();

        if (query.StartDate.HasValue)
            exceptions = exceptions.Where(e => e.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            exceptions = exceptions.Where(e => e.CreatedAt <= query.EndDate.Value);

        var exceptionList = exceptions.ToList();

        var handlerDict = new Dictionary<string, HandlerStats>();

        foreach (var exc in exceptionList)
        {
            if (!string.IsNullOrWhiteSpace(exc.AssignedTo))
            {
                if (!handlerDict.ContainsKey(exc.AssignedTo))
                    handlerDict[exc.AssignedTo] = new HandlerStats();
                handlerDict[exc.AssignedTo].TotalCases++;
                if (exc.Status == ExceptionStatus.ClosedNormal ||
                    exc.Status == ExceptionStatus.ClosedWithSupplement ||
                    exc.Status == ExceptionStatus.ClosedEscalated)
                {
                    handlerDict[exc.AssignedTo].ClosedCases++;
                    if (exc.ResolvedAt.HasValue && exc.AssignedAt.HasValue)
                    {
                        var hours = (exc.ResolvedAt.Value - exc.AssignedAt.Value).TotalHours;
                        handlerDict[exc.AssignedTo].TotalHours += hours;
                    }
                }
                handlerDict[exc.AssignedTo].ExceptionHandled++;
            }

            if (!string.IsNullOrWhiteSpace(exc.Investigator))
            {
                if (!handlerDict.ContainsKey(exc.Investigator))
                    handlerDict[exc.Investigator] = new HandlerStats();
                handlerDict[exc.Investigator].TotalCases++;
            }

            if (!string.IsNullOrWhiteSpace(exc.ResolvedBy))
            {
                if (!handlerDict.ContainsKey(exc.ResolvedBy))
                    handlerDict[exc.ResolvedBy] = new HandlerStats();
                handlerDict[exc.ResolvedBy].TotalCases++;
            }

            if (!string.IsNullOrWhiteSpace(exc.ClosedBy))
            {
                if (!handlerDict.ContainsKey(exc.ClosedBy))
                    handlerDict[exc.ClosedBy] = new HandlerStats();
                handlerDict[exc.ClosedBy].TotalCases++;
            }
        }

        var allSchedules = await _unitOfWork.Schedules.GetAllAsync();
        var schedules = allSchedules.AsQueryable();

        if (query.StartDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            schedules = schedules.Where(s => s.CreatedAt <= query.EndDate.Value);

        var scheduleList = schedules.ToList();

        foreach (var sched in scheduleList)
        {
            if (!string.IsNullOrWhiteSpace(sched.PrimaryNurse))
            {
                if (!handlerDict.ContainsKey(sched.PrimaryNurse))
                    handlerDict[sched.PrimaryNurse] = new HandlerStats();
                handlerDict[sched.PrimaryNurse].TotalCases++;
            }
        }

        if (!string.IsNullOrWhiteSpace(query.HandlerName))
        {
            handlerDict = handlerDict
                .Where(kvp => kvp.Key.Contains(query.HandlerName))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        var topHandlers = handlerDict
            .OrderByDescending(kvp => kvp.Value.TotalCases)
            .Take(10)
            .ToList();

        foreach (var kvp in topHandlers)
        {
            result.TopHandlers.Add(new HandlerCountItem
            {
                HandlerName = kvp.Key,
                TotalProcessed = kvp.Value.TotalCases,
                ExceptionHandled = kvp.Value.ExceptionHandled
            });

            var closedCases = kvp.Value.ClosedCases;
            var avgHours = closedCases > 0 ? kvp.Value.TotalHours / closedCases : 0;
            var closureRate = kvp.Value.TotalCases > 0
                ? Math.Round((decimal)closedCases / kvp.Value.TotalCases * 100, 2)
                : 0;

            result.HandlerEfficiency.Add(new HandlerEfficiencyItem
            {
                HandlerName = kvp.Key,
                TotalCases = kvp.Value.TotalCases,
                ClosedCases = closedCases,
                AverageHandlingHours = Math.Round(avgHours, 2),
                ClosureRate = closureRate
            });
        }

        return result;
    }

    private async Task<ExceptionCauseStatisticsDto> GetExceptionCauseStatisticsAsync(StatisticsQueryDto query)
    {
        var result = new ExceptionCauseStatisticsDto();

        var allExceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();
        var exceptions = allExceptions.AsQueryable();

        if (query.StartDate.HasValue)
            exceptions = exceptions.Where(e => e.OccurredAt >= query.StartDate.Value);
        if (query.EndDate.HasValue)
            exceptions = exceptions.Where(e => e.OccurredAt <= query.EndDate.Value);

        var fallExceptions = exceptions
            .Where(e => e.ExceptionType == ExceptionType.Fall)
            .ToList();

        var fallTotal = fallExceptions.Count;

        var causeDict = new Dictionary<string, int>();
        foreach (var exc in fallExceptions)
        {
            if (!string.IsNullOrWhiteSpace(exc.FallCause))
            {
                var cause = exc.FallCause.Trim();
                if (!causeDict.ContainsKey(cause))
                    causeDict[cause] = 0;
                causeDict[cause]++;
            }
        }

        foreach (var kvp in causeDict.OrderByDescending(kvp => kvp.Value).Take(10))
        {
            result.TopFallCauses.Add(new FallCauseCountItem
            {
                Cause = kvp.Key,
                Count = kvp.Value,
                Percentage = fallTotal > 0 ? Math.Round((decimal)kvp.Value / fallTotal * 100, 2) : 0
            });
        }

        var locationDict = new Dictionary<string, int>();
        foreach (var exc in fallExceptions)
        {
            if (!string.IsNullOrWhiteSpace(exc.OccurredLocation))
            {
                var loc = exc.OccurredLocation.Trim();
                if (!locationDict.ContainsKey(loc))
                    locationDict[loc] = 0;
                locationDict[loc]++;
            }
        }

        foreach (var kvp in locationDict.OrderByDescending(kvp => kvp.Value))
        {
            result.FallLocationBreakdown.Add(new FallLocationCountItem
            {
                Location = kvp.Key,
                Count = kvp.Value,
                Percentage = fallTotal > 0 ? Math.Round((decimal)kvp.Value / fallTotal * 100, 2) : 0
            });
        }

        var injuryDict = new Dictionary<string, int>();
        foreach (var exc in fallExceptions)
        {
            if (!string.IsNullOrWhiteSpace(exc.InjuredPart))
            {
                var parts = exc.InjuredPart.Split(new[] { ',', '、', ';' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var p in parts)
                {
                    var part = p.Trim();
                    if (!string.IsNullOrEmpty(part))
                    {
                        if (!injuryDict.ContainsKey(part))
                            injuryDict[part] = 0;
                        injuryDict[part]++;
                    }
                }
            }
        }

        foreach (var kvp in injuryDict.OrderByDescending(kvp => kvp.Value))
        {
            result.InjuryPartBreakdown.Add(new FallInjuryCountItem
            {
                BodyPart = kvp.Key,
                Count = kvp.Value,
                Percentage = fallTotal > 0 ? Math.Round((decimal)kvp.Value / fallTotal * 100, 2) : 0
            });
        }

        return result;
    }

    private class HandlerStats
    {
        public int TotalCases { get; set; }
        public int ClosedCases { get; set; }
        public int ExceptionHandled { get; set; }
        public double TotalHours { get; set; }
    }
}
