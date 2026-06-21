import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHearingAssignmentDto {
  @ApiProperty({ description: '被指派用户ID' })
  @IsString()
  @IsNotEmpty()
  assigneeId: string;

  @ApiProperty({ description: '角色：主办律师/协办律师/出庭律师/记录员/代理人等' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ description: '是否为主办', default: false })
  @IsOptional()
  @IsBoolean()
  isLead?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
