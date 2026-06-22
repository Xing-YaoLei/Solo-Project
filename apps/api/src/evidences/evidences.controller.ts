import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EvidencesService } from './evidences.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { SupplementRequestDto } from './dto/supplement-request.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, EvidenceStatus, EvidenceCategory } from '@prisma/client';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

const uploadsDir = path.join(process.cwd(), 'uploads');

@ApiTags('证据归档')
@Controller('evidences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Post()
  @Permissions(Permission.EVIDENCE_CREATE)
  @OperationLog({
    targetType: 'Evidence',
    action: 'CREATE' as any,
    description: '创建证据',
  })
  @ApiOperation({ summary: '创建证据' })
  create(
    @Body() createEvidenceDto: CreateEvidenceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.evidencesService.create(createEvidenceDto, user.id);
  }

  @Get()
  @Permissions(Permission.EVIDENCE_VIEW)
  @ApiOperation({ summary: '获取证据列表' })
  @ApiQuery({ name: 'status', enum: EvidenceStatus, required: false })
  @ApiQuery({ name: 'category', enum: EvidenceCategory, required: false })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'submittedById', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: EvidenceStatus,
    @Query('category') category?: EvidenceCategory,
    @Query('taskId') taskId?: string,
    @Query('submittedById') submittedById?: string,
  ) {
    return this.evidencesService.findAll(pagination, {
      status,
      category,
      taskId,
      submittedById,
    });
  }

  @Get(':id')
  @Permissions(Permission.EVIDENCE_VIEW)
  @ApiOperation({ summary: '获取证据详情' })
  findOne(@Param('id') id: string) {
    return this.evidencesService.findOne(id);
  }

  @Patch(':id')
  @Permissions(Permission.EVIDENCE_EDIT)
  @OperationLog({
    targetType: 'Evidence',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '更新证据',
  })
  @ApiOperation({ summary: '更新证据' })
  update(@Param('id') id: string, @Body() updateEvidenceDto: UpdateEvidenceDto) {
    return this.evidencesService.update(id, updateEvidenceDto);
  }

  @Delete(':id')
  @Permissions(Permission.EVIDENCE_DELETE)
  @OperationLog({
    targetType: 'Evidence',
    action: 'DELETE' as any,
    targetIdField: 'id',
    description: '删除证据',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除证据' })
  remove(@Param('id') id: string) {
    return this.evidencesService.remove(id);
  }

  @Post(':id/submit')
  @Permissions(Permission.EVIDENCE_SUBMIT)
  @OperationLog({
    targetType: 'Evidence',
    action: 'SUBMIT' as any,
    targetIdField: 'id',
    description: '提交证据',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交证据' })
  submit(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.evidencesService.submit(id, user.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const fs = require('fs');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const evidenceDir = path.join(uploadsDir, req.body.evidenceId || 'default');
          if (!fs.existsSync(evidenceDir)) {
            fs.mkdirSync(evidenceDir, { recursive: true });
          }
          cb(null, evidenceDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  @Permissions(Permission.EVIDENCE_UPLOAD)
  @OperationLog({
    targetType: 'Evidence',
    action: 'UPLOAD' as any,
    description: '上传附件',
    getTargetId: (_ctx, result) => result?.evidenceId || '',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        evidenceId: { type: 'string' },
        description: { type: 'string' },
        isSupplement: { type: 'boolean' },
      },
      required: ['file', 'evidenceId'],
    },
  })
  @ApiOperation({ summary: '上传附件' })
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAttachmentDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.evidencesService.uploadAttachment(file, uploadDto, user.id);
  }

  @Post('supplement/request')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.REVIEW_CONDUCT)
  @OperationLog({
    targetType: 'Evidence',
    action: 'UPDATE' as any,
    description: '发起补附件请求',
    getTargetId: (_ctx, result) => result?.evidenceId || '',
  })
  @ApiOperation({ summary: '发起补附件请求' })
  requestSupplement(
    @Body() requestDto: SupplementRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.evidencesService.requestSupplement(requestDto, user.id);
  }

  @Post('supplement/:id/complete')
  @Permissions(Permission.EVIDENCE_SUBMIT)
  @OperationLog({
    targetType: 'Evidence',
    action: 'UPDATE' as any,
    description: '完成补附件',
    targetIdField: 'id',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '完成补附件' })
  completeSupplement(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.evidencesService.completeSupplement(id, user.id);
  }
}
