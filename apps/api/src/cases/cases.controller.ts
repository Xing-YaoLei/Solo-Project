import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CasesService } from './cases.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  AssistantReviewDto,
  LawyerSupplementDto,
} from './dto/cases.dto';

@Controller('cases')
@UseGuards(AuthGuard('jwt'))
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('caseType') caseType?: string,
    @Query('lawyerId') lawyerId?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.casesService.findAll({ status, caseType, lawyerId, clientId, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }

  @Post(':id/assistant-review')
  assistantReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: AssistantReviewDto,
  ) {
    return this.casesService.assistantReview(id, req.user.userId, dto);
  }

  @Post(':id/lawyer-supplement')
  lawyerSupplement(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: LawyerSupplementDto,
  ) {
    return this.casesService.lawyerSupplement(id, req.user.userId, dto);
  }
}
