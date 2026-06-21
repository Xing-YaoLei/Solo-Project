import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CaseType,
  CaseStage,
  FeeType,
  MaterialType,
} from '@legal/shared';
import { MaterialUploadDto } from './material-upload.dto';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(CaseType)
  caseType: CaseType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientIdNumber: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsNotEmpty()
  opposingPartyName: string;

  @IsString()
  @IsOptional()
  opposingPartyIdNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialUploadDto)
  materials: MaterialUploadDto[];
}

export class UpdateCaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(CaseType)
  @IsOptional()
  caseType?: CaseType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  lawyerId?: string;

  @IsString()
  @IsOptional()
  assistantId?: string;
}

export class AssistantReviewDto {
  @IsBoolean()
  identityVerified: boolean;

  @IsString()
  @IsOptional()
  identityNote?: string;

  @IsBoolean()
  evidenceChecklistComplete: boolean;

  @IsString()
  @IsOptional()
  evidenceNote?: string;

  @IsArray()
  @IsString({ each: true })
  materialsApproved: string[];

  @IsArray()
  @IsString({ each: true })
  materialsRejected: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissingMaterialDto)
  materialsMissing: MissingMaterialDto[];

  @IsString()
  @IsOptional()
  reviewNote?: string;
}

export class MissingMaterialDto {
  @IsString()
  @IsOptional()
  materialId?: string;

  @IsEnum(MaterialType)
  materialType: MaterialType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  missingPages?: number[];
}

export class LawyerSupplementDto {
  @IsEnum(CaseStage)
  caseStage: CaseStage;

  @IsString()
  @IsOptional()
  trialDate?: string;

  @IsString()
  @IsOptional()
  trialLocation?: string;

  @IsEnum(FeeType)
  feeType: FeeType;

  @IsNotEmpty()
  feeAmount: number;

  @IsString()
  @IsOptional()
  feeNote?: string;

  @IsArray()
  @IsString({ each: true })
  riskWarnings: string[];

  @IsString()
  @IsOptional()
  supplementNote?: string;
}
