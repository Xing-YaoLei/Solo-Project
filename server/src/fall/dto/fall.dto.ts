import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateFallDto {
  @ApiProperty()
  @IsString()
  elderId!: string;

  @ApiProperty()
  @IsString()
  reportedBy!: string;

  @ApiProperty()
  @IsDateString()
  incidentTime!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty()
  @IsString()
  description!: string;
}

export class CreateCommunicationDto {
  @ApiProperty()
  @IsString()
  authorId!: string;

  @ApiProperty()
  @IsString()
  authorName!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  @IsIn(['NOTE', 'PHONE_CALL', 'FAMILY_NOTIFICATION'])
  type!: string;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  reviewerId!: string;

  @ApiProperty()
  @IsString()
  reviewerName!: string;

  @ApiProperty()
  @IsString()
  conclusion!: string;

  @ApiProperty()
  @IsString()
  actionPlan!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
