import { ApiProperty } from '@nestjs/swagger';

export class ChangeTypeDto {
  @ApiProperty({ description: '变更类型编码' })
  value: string;

  @ApiProperty({ description: '变更类型名称' })
  label: string;
}
