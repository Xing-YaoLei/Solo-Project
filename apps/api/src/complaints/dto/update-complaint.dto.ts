import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ComplaintSource, Priority, ComplaintStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateComplaintDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ enum: ComplaintSource, required: false })
  @IsOptional()
  @IsEnum(ComplaintSource)
  source?: ComplaintSource;

  @ApiProperty({ enum: ComplaintStatus, required: false })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiProperty({ enum: Priority, required: false })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  visitorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  visitorPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  visitorIdCard?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ticketNo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  deadlineAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
