using ElderCareScheduling.API.Enums;

namespace ElderCareScheduling.API.Services;

public static class EnumHelper
{
    public static string GetGenderText(Gender gender)
    {
        return gender switch
        {
            Gender.Male => "男",
            Gender.Female => "女",
            Gender.Other => "其他",
            _ => gender.ToString()
        };
    }

    public static string GetSourceTypeText(SourceType sourceType)
    {
        return sourceType switch
        {
            SourceType.SelfRegistration => "自行登记",
            SourceType.HospitalReferral => "医院转诊",
            SourceType.CommunityReferral => "社区推荐",
            SourceType.FamilyIntroduction => "家属介绍",
            SourceType.OnlineBooking => "线上预约",
            SourceType.Other => "其他",
            _ => sourceType.ToString()
        };
    }

    public static string GetBedStatusText(BedStatus status)
    {
        return status switch
        {
            BedStatus.Available => "可用",
            BedStatus.Occupied => "已占用",
            BedStatus.Reserved => "已预留",
            BedStatus.Maintenance => "维修中",
            BedStatus.Cleaning => "清洁中",
            _ => status.ToString()
        };
    }

    public static string GetCareLevelTypeText(CareLevelType levelType)
    {
        return levelType switch
        {
            CareLevelType.Independent => "自理级",
            CareLevelType.SemiAssisted => "半护理级",
            CareLevelType.FullAssisted => "全护理级",
            CareLevelType.Intensive => "特护级",
            CareLevelType.Special => "专护级",
            _ => levelType.ToString()
        };
    }

    public static string GetScheduleStatusText(ScheduleStatus status)
    {
        return status switch
        {
            ScheduleStatus.Draft => "草稿",
            ScheduleStatus.Submitted => "已提交",
            ScheduleStatus.UnderReview => "审核中",
            ScheduleStatus.ReviewApproved => "审核通过",
            ScheduleStatus.ReviewRejected => "审核驳回",
            ScheduleStatus.InProgress => "进行中",
            ScheduleStatus.Processing => "处理中",
            ScheduleStatus.ExceptionOccurred => "异常发生",
            ScheduleStatus.Completed => "已完成",
            ScheduleStatus.UnderReviewPost => "复盘审核中",
            ScheduleStatus.Reviewed => "已复盘",
            ScheduleStatus.Closed => "已关闭",
            ScheduleStatus.Archived => "已归档",
            _ => status.ToString()
        };
    }

    public static string GetExceptionTypeText(ExceptionType type)
    {
        return type switch
        {
            ExceptionType.Fall => "跌倒",
            ExceptionType.MedicationError => "用药错误",
            ExceptionType.Missing => "走失",
            ExceptionType.PhysicalDiscomfort => "身体不适",
            ExceptionType.EquipmentFailure => "设备故障",
            ExceptionType.Other => "其他",
            _ => type.ToString()
        };
    }

    public static string GetExceptionSeverityText(ExceptionSeverity severity)
    {
        return severity switch
        {
            ExceptionSeverity.Low => "低",
            ExceptionSeverity.Medium => "中",
            ExceptionSeverity.High => "高",
            ExceptionSeverity.Critical => "危急",
            _ => severity.ToString()
        };
    }

    public static string GetExceptionStatusText(ExceptionStatus status)
    {
        return status switch
        {
            ExceptionStatus.Reported => "已报告",
            ExceptionStatus.Investigating => "调查中",
            ExceptionStatus.Handling => "处理中",
            ExceptionStatus.PendingSupplement => "待补充材料",
            ExceptionStatus.Escalated => "已升级",
            ExceptionStatus.Resolved => "已解决",
            ExceptionStatus.ClosedNormal => "正常关闭",
            ExceptionStatus.ClosedWithSupplement => "补充材料后关闭",
            ExceptionStatus.ClosedEscalated => "升级后关闭",
            _ => status.ToString()
        };
    }

    public static string GetExceptionCloseTypeText(ExceptionCloseType closeType)
    {
        return closeType switch
        {
            ExceptionCloseType.NormalClose => "正常关闭",
            ExceptionCloseType.SupplementRequired => "需补充材料",
            ExceptionCloseType.Escalation => "升级处理",
            _ => closeType.ToString()
        };
    }

    public static string GetReviewTypeText(ReviewType reviewType)
    {
        return reviewType switch
        {
            ReviewType.ScheduleReview => "排班审核",
            ReviewType.ExceptionReview => "异常审核",
            ReviewType.PostProcessReview => "复盘审核",
            _ => reviewType.ToString()
        };
    }

    public static string GetReviewResultText(ReviewResult result)
    {
        return result switch
        {
            ReviewResult.Pending => "待审核",
            ReviewResult.Approved => "通过",
            ReviewResult.Rejected => "驳回",
            ReviewResult.ConditionalApproved => "有条件通过",
            _ => result.ToString()
        };
    }

    public static string GetCareStandardText(CareStandard standard)
    {
        return standard switch
        {
            CareStandard.NotEvaluated => "未评估",
            CareStandard.BelowStandard => "低于标准",
            CareStandard.MeetsStandard => "达到标准",
            CareStandard.ExceedsStandard => "超出标准",
            _ => standard.ToString()
        };
    }

    public static string GetShiftTypeText(ShiftType shiftType)
    {
        return shiftType switch
        {
            ShiftType.Morning => "早班",
            ShiftType.Afternoon => "中班",
            ShiftType.Night => "夜班",
            ShiftType.FullDay => "全天",
            _ => shiftType.ToString()
        };
    }
}
