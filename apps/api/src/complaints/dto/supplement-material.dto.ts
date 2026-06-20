import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SupplementMaterialDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectComplaintDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class UpgradeComplaintDto {
  @ApiProperty()
  @IsString()
  toLevel: string;

  @ApiProperty()
  @IsString()
  reason: string;
}
