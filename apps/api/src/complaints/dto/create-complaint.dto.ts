import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ComplaintSource, Priority } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: ComplaintSource })
  @IsEnum(ComplaintSource)
  source: ComplaintSource;

  @ApiProperty({ enum: Priority, required: false })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty()
  @IsString()
  visitorName: string;

  @ApiProperty()
  @IsString()
  visitorPhone: string;

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

  @ApiProperty()
  @IsDateString()
  deadlineAt: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
