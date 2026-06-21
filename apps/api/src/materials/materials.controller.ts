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
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  ResubmitMaterialDto,
} from './dto/materials.dto';

@Controller('cases/:caseId/materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.materialsService.create(caseId, req.user.userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Param('caseId') caseId: string) {
    return this.materialsService.findAll(caseId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, req.user.userId, dto);
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'))
  approve(@Param('id') id: string, @Req() req: any, @Body() body?: { note?: string }) {
    return this.materialsService.approve(id, req.user.userId, body?.note);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard('jwt'))
  reject(@Param('id') id: string, @Req() req: any, @Body() body?: { note?: string }) {
    return this.materialsService.reject(id, req.user.userId, body?.note);
  }

  @Post(':id/resubmit')
  @UseGuards(AuthGuard('jwt'))
  resubmit(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ResubmitMaterialDto,
  ) {
    return this.materialsService.resubmit(id, req.user.userId, dto);
  }
}
