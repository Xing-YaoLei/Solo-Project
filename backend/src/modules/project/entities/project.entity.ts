import { Project } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ProjectEntity implements Project {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ required: false })
  projectManagerId: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  startDate: Date | null;

  @ApiProperty({ required: false })
  endDate: Date | null;

  @ApiProperty({ type: Number, required: false })
  totalBudget: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProjectWithRelations extends ProjectEntity {
  @ApiProperty()
  owner: any;

  @ApiProperty({ required: false })
  projectManager?: any;
}
