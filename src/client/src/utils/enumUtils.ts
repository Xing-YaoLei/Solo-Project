import type { TagProps } from 'antd';
import {
  ScheduleStatus,
  CareLevelType,
  ShiftType,
  Gender,
  BedStatus,
  ExceptionType,
  ExceptionSeverity,
  ExceptionCloseType,
  ExceptionStatus,
  ReviewType,
  ReviewResult,
  SourceType,
  CareStandard,
} from '@/types';

type EnumKey = string | number;

interface EnumMapping<T extends EnumKey> {
  value: T;
  label: string;
  color?: TagProps['color'];
}

export const scheduleStatusMap: EnumMapping<ScheduleStatus>[] = [
  { value: ScheduleStatus.Draft, label: '草稿', color: 'default' },
  { value: ScheduleStatus.Submitted, label: '已提交', color: 'blue' },
  { value: ScheduleStatus.UnderReview, label: '审核中', color: 'processing' },
  { value: ScheduleStatus.ReviewApproved, label: '审核通过', color: 'success' },
  { value: ScheduleStatus.ReviewRejected, label: '审核驳回', color: 'error' },
  { value: ScheduleStatus.InProgress, label: '进行中', color: 'cyan' },
  { value: ScheduleStatus.Processing, label: '处理中', color: 'geekblue' },
  { value: ScheduleStatus.ExceptionOccurred, label: '发生异常', color: 'warning' },
  { value: ScheduleStatus.Completed, label: '已完成', color: 'purple' },
  { value: ScheduleStatus.UnderReviewPost, label: '事后审核中', color: 'magenta' },
  { value: ScheduleStatus.Reviewed, label: '已审核', color: 'gold' },
  { value: ScheduleStatus.Closed, label: '已关闭', color: 'default' },
  { value: ScheduleStatus.Archived, label: '已归档', color: 'default' },
];

export const careLevelTypeMap: EnumMapping<CareLevelType>[] = [
  { value: CareLevelType.Independent, label: '自理', color: 'green' },
  { value: CareLevelType.SemiAssisted, label: '半自理', color: 'blue' },
  { value: CareLevelType.FullAssisted, label: '全护理', color: 'orange' },
  { value: CareLevelType.Intensive, label: '特护', color: 'red' },
  { value: CareLevelType.Special, label: '专护', color: 'purple' },
];

export const shiftTypeMap: EnumMapping<ShiftType>[] = [
  { value: ShiftType.Morning, label: '早班', color: 'gold' },
  { value: ShiftType.Afternoon, label: '午班', color: 'blue' },
  { value: ShiftType.Night, label: '夜班', color: 'purple' },
  { value: ShiftType.FullDay, label: '全天', color: 'cyan' },
];

export const genderMap: EnumMapping<Gender>[] = [
  { value: Gender.Male, label: '男', color: 'blue' },
  { value: Gender.Female, label: '女', color: 'pink' },
  { value: Gender.Other, label: '其他', color: 'default' },
];

export const bedStatusMap: EnumMapping<BedStatus>[] = [
  { value: BedStatus.Available, label: '空闲', color: 'green' },
  { value: BedStatus.Occupied, label: '已占用', color: 'red' },
  { value: BedStatus.Reserved, label: '已预约', color: 'blue' },
  { value: BedStatus.Maintenance, label: '维护中', color: 'orange' },
  { value: BedStatus.Cleaning, label: '清洁中', color: 'cyan' },
];

export const exceptionTypeMap: EnumMapping<ExceptionType>[] = [
  { value: ExceptionType.Fall, label: '跌倒', color: 'red' },
  { value: ExceptionType.MedicationError, label: '用药错误', color: 'orange' },
  { value: ExceptionType.Missing, label: '走失', color: 'warning' },
  { value: ExceptionType.PhysicalDiscomfort, label: '身体不适', color: 'magenta' },
  { value: ExceptionType.EquipmentFailure, label: '设备故障', color: 'purple' },
  { value: ExceptionType.Other, label: '其他', color: 'default' },
];

export const exceptionSeverityMap: EnumMapping<ExceptionSeverity>[] = [
  { value: ExceptionSeverity.Low, label: '低', color: 'green' },
  { value: ExceptionSeverity.Medium, label: '中', color: 'gold' },
  { value: ExceptionSeverity.High, label: '高', color: 'orange' },
  { value: ExceptionSeverity.Critical, label: '严重', color: 'red' },
];

export const exceptionCloseTypeMap: EnumMapping<ExceptionCloseType>[] = [
  { value: ExceptionCloseType.NormalClose, label: '正常关闭', color: 'green' },
  { value: ExceptionCloseType.SupplementRequired, label: '需补充材料', color: 'blue' },
  { value: ExceptionCloseType.Escalation, label: '升级处理', color: 'red' },
];

export const exceptionStatusMap: EnumMapping<ExceptionStatus>[] = [
  { value: ExceptionStatus.Reported, label: '已上报', color: 'default' },
  { value: ExceptionStatus.Investigating, label: '调查中', color: 'blue' },
  { value: ExceptionStatus.Handling, label: '处理中', color: 'processing' },
  { value: ExceptionStatus.PendingSupplement, label: '待补充材料', color: 'warning' },
  { value: ExceptionStatus.Escalated, label: '已升级', color: 'orange' },
  { value: ExceptionStatus.Resolved, label: '已解决', color: 'cyan' },
  { value: ExceptionStatus.ClosedNormal, label: '正常关闭', color: 'success' },
  { value: ExceptionStatus.ClosedWithSupplement, label: '补充后关闭', color: 'green' },
  { value: ExceptionStatus.ClosedEscalated, label: '升级后关闭', color: 'purple' },
];

export const reviewTypeMap: EnumMapping<ReviewType>[] = [
  { value: ReviewType.ScheduleReview, label: '排班审核', color: 'blue' },
  { value: ReviewType.ExceptionReview, label: '异常审核', color: 'orange' },
  { value: ReviewType.PostProcessReview, label: '事后审核', color: 'purple' },
];

export const reviewResultMap: EnumMapping<ReviewResult>[] = [
  { value: ReviewResult.Pending, label: '待审核', color: 'default' },
  { value: ReviewResult.Approved, label: '通过', color: 'success' },
  { value: ReviewResult.Rejected, label: '驳回', color: 'error' },
  { value: ReviewResult.ConditionalApproved, label: '有条件通过', color: 'warning' },
];

export const sourceTypeMap: EnumMapping<SourceType>[] = [
  { value: SourceType.SelfRegistration, label: '自行登记', color: 'green' },
  { value: SourceType.HospitalReferral, label: '医院转介', color: 'blue' },
  { value: SourceType.CommunityReferral, label: '社区转介', color: 'cyan' },
  { value: SourceType.FamilyIntroduction, label: '家属介绍', color: 'purple' },
  { value: SourceType.OnlineBooking, label: '线上预约', color: 'magenta' },
  { value: SourceType.Other, label: '其他', color: 'default' },
];

export const careStandardMap: EnumMapping<CareStandard>[] = [
  { value: CareStandard.NotEvaluated, label: '未评估', color: 'default' },
  { value: CareStandard.BelowStandard, label: '未达标', color: 'error' },
  { value: CareStandard.MeetsStandard, label: '达标', color: 'success' },
  { value: CareStandard.ExceedsStandard, label: '超标准', color: 'cyan' },
];

function getMapping<T extends EnumKey>(
  map: EnumMapping<T>[],
  value: T | undefined | null
): EnumMapping<T> | undefined {
  if (value === undefined || value === null) return undefined;
  return map.find((item) => item.value === value);
}

export function getEnumLabel<T extends EnumKey>(
  map: EnumMapping<T>[],
  value: T | undefined | null
): string {
  const item = getMapping(map, value);
  return item?.label ?? '';
}

export function getEnumColor<T extends EnumKey>(
  map: EnumMapping<T>[],
  value: T | undefined | null
): TagProps['color'] {
  const item = getMapping(map, value);
  return item?.color ?? 'default';
}

export function getEnumOptions<T extends EnumKey>(map: EnumMapping<T>[]) {
  return map.map((item) => ({
    label: item.label,
    value: item.value,
  }));
}
