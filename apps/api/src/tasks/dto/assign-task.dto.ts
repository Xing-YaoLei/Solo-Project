import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty({ description: '分派给的用户ID' })
  @IsUUID('4', { message: '用户ID格式不正确' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  assignedToId: string;

  @ApiPropertyOptional({ description: '业务负责人ID' })
  @IsUUID('4', { message: '业务负责人ID格式不正确' })
  @IsOptional()
  businessOwnerId?: string;

  @ApiPropertyOptional({ description: '截止日期', example: '2024-06-30' })
  @IsDateString({}, { message: '截止日期格式不正确' })
  @IsOptional()
  dueDate?: string;
}
