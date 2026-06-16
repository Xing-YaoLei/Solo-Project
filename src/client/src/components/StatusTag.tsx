import React from 'react';
import { Tag } from 'antd';
import type { TagProps } from 'antd';
import {
  scheduleStatusMap,
  careLevelTypeMap,
  shiftTypeMap,
  genderMap,
  bedStatusMap,
  exceptionTypeMap,
  exceptionSeverityMap,
  exceptionCloseTypeMap,
  exceptionStatusMap,
  reviewTypeMap,
  reviewResultMap,
  sourceTypeMap,
  careStandardMap,
  getEnumLabel,
  getEnumColor,
} from '@/utils/enumUtils';
import type {
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

interface EnumMappingItem<T extends EnumKey> {
  value: T;
  label: string;
  color?: TagProps['color'];
}

interface StatusTagProps<T extends EnumKey> {
  value: T | undefined | null;
  enumMap: EnumMappingItem<T>[];
}

function BaseStatusTag<T extends EnumKey>({
  value,
  enumMap,
}: StatusTagProps<T>): React.ReactElement | null {
  if (value === undefined || value === null) return null;
  const label = getEnumLabel(enumMap, value);
  const color = getEnumColor(enumMap, value);
  return <Tag color={color}>{label}</Tag>;
}

interface ScheduleStatusTagProps {
  value: ScheduleStatus | undefined | null;
}

export const ScheduleStatusTag: React.FC<ScheduleStatusTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={scheduleStatusMap as EnumMappingItem<EnumKey>[]} />
);

interface CareLevelTypeTagProps {
  value: CareLevelType | undefined | null;
}

export const CareLevelTypeTag: React.FC<CareLevelTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={careLevelTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface ShiftTypeTagProps {
  value: ShiftType | undefined | null;
}

export const ShiftTypeTag: React.FC<ShiftTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={shiftTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface GenderTagProps {
  value: Gender | undefined | null;
}

export const GenderTag: React.FC<GenderTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={genderMap as EnumMappingItem<EnumKey>[]} />
);

interface BedStatusTagProps {
  value: BedStatus | undefined | null;
}

export const BedStatusTag: React.FC<BedStatusTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={bedStatusMap as EnumMappingItem<EnumKey>[]} />
);

interface ExceptionTypeTagProps {
  value: ExceptionType | undefined | null;
}

export const ExceptionTypeTag: React.FC<ExceptionTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={exceptionTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface ExceptionSeverityTagProps {
  value: ExceptionSeverity | undefined | null;
}

export const ExceptionSeverityTag: React.FC<ExceptionSeverityTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={exceptionSeverityMap as EnumMappingItem<EnumKey>[]} />
);

interface ExceptionCloseTypeTagProps {
  value: ExceptionCloseType | undefined | null;
}

export const ExceptionCloseTypeTag: React.FC<ExceptionCloseTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={exceptionCloseTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface ExceptionStatusTagProps {
  value: ExceptionStatus | undefined | null;
}

export const ExceptionStatusTag: React.FC<ExceptionStatusTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={exceptionStatusMap as EnumMappingItem<EnumKey>[]} />
);

interface ReviewTypeTagProps {
  value: ReviewType | undefined | null;
}

export const ReviewTypeTag: React.FC<ReviewTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={reviewTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface ReviewResultTagProps {
  value: ReviewResult | undefined | null;
}

export const ReviewResultTag: React.FC<ReviewResultTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={reviewResultMap as EnumMappingItem<EnumKey>[]} />
);

interface SourceTypeTagProps {
  value: SourceType | undefined | null;
}

export const SourceTypeTag: React.FC<SourceTypeTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={sourceTypeMap as EnumMappingItem<EnumKey>[]} />
);

interface CareStandardTagProps {
  value: CareStandard | undefined | null;
}

export const CareStandardTag: React.FC<CareStandardTagProps> = ({ value }) => (
  <BaseStatusTag value={value} enumMap={careStandardMap as EnumMappingItem<EnumKey>[]} />
);

export default ScheduleStatusTag;
