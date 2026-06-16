import React from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
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
  getEnumOptions,
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

interface BaseEnumSelectProps<T extends EnumKey>
  extends Omit<SelectProps<T>, 'options'> {
  options: { label: string; value: T }[];
}

function BaseEnumSelect<T extends EnumKey>({
  options,
  ...rest
}: BaseEnumSelectProps<T>): React.ReactElement {
  return <Select<T> style={{ width: '100%' }} options={options} {...rest} />;
}

interface ScheduleStatusSelectProps extends Omit<SelectProps<ScheduleStatus>, 'options'> {}

export const ScheduleStatusSelect: React.FC<ScheduleStatusSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(scheduleStatusMap) as { label: string; value: ScheduleStatus }[]}
    {...props}
  />
);

interface CareLevelTypeSelectProps extends Omit<SelectProps<CareLevelType>, 'options'> {}

export const CareLevelTypeSelect: React.FC<CareLevelTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(careLevelTypeMap) as { label: string; value: CareLevelType }[]}
    {...props}
  />
);

interface ShiftTypeSelectProps extends Omit<SelectProps<ShiftType>, 'options'> {}

export const ShiftTypeSelect: React.FC<ShiftTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(shiftTypeMap) as { label: string; value: ShiftType }[]}
    {...props}
  />
);

interface GenderSelectProps extends Omit<SelectProps<Gender>, 'options'> {}

export const GenderSelect: React.FC<GenderSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(genderMap) as { label: string; value: Gender }[]}
    {...props}
  />
);

interface BedStatusSelectProps extends Omit<SelectProps<BedStatus>, 'options'> {}

export const BedStatusSelect: React.FC<BedStatusSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(bedStatusMap) as { label: string; value: BedStatus }[]}
    {...props}
  />
);

interface ExceptionTypeSelectProps extends Omit<SelectProps<ExceptionType>, 'options'> {}

export const ExceptionTypeSelect: React.FC<ExceptionTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(exceptionTypeMap) as { label: string; value: ExceptionType }[]}
    {...props}
  />
);

interface ExceptionSeveritySelectProps extends Omit<SelectProps<ExceptionSeverity>, 'options'> {}

export const ExceptionSeveritySelect: React.FC<ExceptionSeveritySelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(exceptionSeverityMap) as { label: string; value: ExceptionSeverity }[]}
    {...props}
  />
);

interface ExceptionCloseTypeSelectProps extends Omit<SelectProps<ExceptionCloseType>, 'options'> {}

export const ExceptionCloseTypeSelect: React.FC<ExceptionCloseTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(exceptionCloseTypeMap) as { label: string; value: ExceptionCloseType }[]}
    {...props}
  />
);

interface ExceptionStatusSelectProps extends Omit<SelectProps<ExceptionStatus>, 'options'> {}

export const ExceptionStatusSelect: React.FC<ExceptionStatusSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(exceptionStatusMap) as { label: string; value: ExceptionStatus }[]}
    {...props}
  />
);

interface ReviewTypeSelectProps extends Omit<SelectProps<ReviewType>, 'options'> {}

export const ReviewTypeSelect: React.FC<ReviewTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(reviewTypeMap) as { label: string; value: ReviewType }[]}
    {...props}
  />
);

interface ReviewResultSelectProps extends Omit<SelectProps<ReviewResult>, 'options'> {}

export const ReviewResultSelect: React.FC<ReviewResultSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(reviewResultMap) as { label: string; value: ReviewResult }[]}
    {...props}
  />
);

interface SourceTypeSelectProps extends Omit<SelectProps<SourceType>, 'options'> {}

export const SourceTypeSelect: React.FC<SourceTypeSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(sourceTypeMap) as { label: string; value: SourceType }[]}
    {...props}
  />
);

interface CareStandardSelectProps extends Omit<SelectProps<CareStandard>, 'options'> {}

export const CareStandardSelect: React.FC<CareStandardSelectProps> = (props) => (
  <BaseEnumSelect
    options={getEnumOptions(careStandardMap) as { label: string; value: CareStandard }[]}
    {...props}
  />
);

export default ScheduleStatusSelect;
