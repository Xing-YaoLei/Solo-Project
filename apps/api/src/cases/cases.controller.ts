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
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCaseDto) {
    const userId = req.user?.userId || '';
    return this.casesService.create(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Query('status') status?: string,
    @Query('caseType') caseType?: string,
    @Query('lawyerId') lawyerId?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.casesService.findAll({
      status,
      caseType,
      lawyerId,
      clientId,
      page,
      limit,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }

  @Post(':id/assistant-review')
  @UseGuards(AuthGuard('jwt'))
  assistantReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: AssistantReviewDto,
  ) {
    return this.casesService.assistantReview(id, req.user.userId, dto);
  }

  @Post(':id/lawyer-supplement')
  @UseGuards(AuthGuard('jwt'))
  lawyerSupplement(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: LawyerSupplementDto,
  ) {
    return this.casesService.lawyerSupplement(id, req.user.userId, dto);
  }
}
