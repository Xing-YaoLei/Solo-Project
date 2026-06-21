import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MaterialsService } from './materials.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  ResubmitMaterialDto,
  MarkMissingPagesDto,
  AddMissingMaterialDto,
} from './dto/materials.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

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

  @Post(':id/mark-missing-pages')
  @UseGuards(AuthGuard('jwt'))
  markMissingPages(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: MarkMissingPagesDto,
  ) {
    return this.materialsService.markMissingPages(id, req.user.userId, dto);
  }

  @Post('add-missing')
  @UseGuards(AuthGuard('jwt'))
  addMissingMaterial(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() dto: AddMissingMaterialDto,
  ) {
    return this.materialsService.addMissingMaterial(caseId, req.user.userId, dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @Param('caseId') caseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }
}
