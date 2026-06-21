import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto, ResubmitMaterialDto } from './dto/materials.dto';

@Controller('cases/:caseId/materials')
@UseGuards(AuthGuard('jwt'))
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  create(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.materialsService.create(caseId, req.user.userId, dto);
  }

  @Get()
  findAll(@Param('caseId') caseId: string) {
    return this.materialsService.findAll(caseId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, req.user.userId, dto);
  }

  @Post(':id/resubmit')
  resubmit(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ResubmitMaterialDto,
  ) {
    return this.materialsService.resubmit(id, req.user.userId, dto);
  }
}
