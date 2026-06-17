import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsArray } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  elderId!: string;

  @ApiProperty()
  @IsString()
  activityName!: string;

  @ApiProperty()
  @IsDateString()
  activityDate!: string;
}

export class CheckInDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsBoolean()
  checkedIn!: boolean;
}

export class BulkCheckInDto {
  @ApiProperty({ type: [CheckInDto] })
  @IsArray()
  items!: CheckInDto[];
}

export class BulkCheckInIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  ids!: string[];
}
