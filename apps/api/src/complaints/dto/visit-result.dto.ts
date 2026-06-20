import { IsInt, IsString, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VisitResultDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction: number;

  @ApiProperty()
  @IsString()
  feedback: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  needFollowUp: boolean = false;

  @ApiProperty()
  @IsDateString()
  visitedAt: string;
}
