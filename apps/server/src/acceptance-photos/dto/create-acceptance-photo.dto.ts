import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcceptancePhotoDto {
  @ApiProperty({ description: '变更单ID' })
  @IsString()
  @IsNotEmpty()
  changeOrderId: string;

  @ApiProperty({ description: '照片URL' })
  @IsString()
  @IsNotEmpty()
  photoUrl: string;

  @ApiPropertyOptional({ description: '缩略图URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '阶段' })
  @IsString()
  @IsOptional()
  phase?: string;
}
