import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConflictCheckService } from './conflict-check.service';
import {
  CreateConflictCheckDto,
  ArchiveConflictCheckDto,
} from './dto/conflict-check.dto';

@Controller()
export class ConflictCheckController {
  constructor(private conflictCheckService: ConflictCheckService) {}

  @Post('cases/:caseId/conflict-checks')
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() _dto: CreateConflictCheckDto,
  ) {
    return this.conflictCheckService.performCheck(caseId, req.user.userId);
  }

  @Get('cases/:caseId/conflict-checks')
  @UseGuards(AuthGuard('jwt'))
  findAll(@Param('caseId') caseId: string) {
    return this.conflictCheckService.findAll(caseId);
  }

  @Post('conflict-checks/:id/archive')
  @UseGuards(AuthGuard('jwt'))
  archive(
    @Param('id') id: string,
    @Body() dto: ArchiveConflictCheckDto,
  ) {
    return this.conflictCheckService.archive(id, dto);
  }
}
