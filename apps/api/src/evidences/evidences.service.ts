import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { SupplementRequestDto } from './dto/supplement-request.dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { EvidenceStatus, EvidenceCategory, TaskStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const evidenceSelectFields = {
  id: true,
  evidenceNo: true,
  title: true,
  description: true,
  category: true,
  status: true,
  taskId: true,
  submittedAt: true,
  archivedAt: true,
  relatedDocumentNo: true,
  relatedDocumentType: true,
  relatedDocumentDate: true,
  relatedDocumentAmount: true,
  createdAt: true,
  updatedAt: true,
  task: {
    select: {
      id: true,
      taskNo: true,
      title: true,
      status: true,
    },
  },
  submittedBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  _count: {
    select: {
      attachments: true,
      reviews: true,
      supplementHistory: true,
    },
  },
};

const attachmentSelectFields = {
  id: true,
  fileName: true,
  originalName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  fileHash: true,
  version: true,
  isSupplement: true,
  uploadedAt: true,
  uploadedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
};

@Injectable()
export class EvidencesService {
  private readonly logger = new Logger(EvidencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateEvidenceNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EV${year}`;

    const last = await this.prisma.evidence.findFirst({
      where: { evidenceNo: { startsWith: prefix } },
      orderBy: { evidenceNo: 'desc' },
    });

    let sequence = 1;
    if (last) {
      const match = last.evidenceNo.match(/(\d{6})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  private calculateFileMD5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async create(createEvidenceDto: CreateEvidenceDto, userId: string) {
    const task = await this.prisma.auditTask.findUnique({
      where: { id: createEvidenceDto.taskId },
    });
    if (!task) {
      throw new HttpException('关联任务不存在', HttpStatus.NOT_FOUND);
    }

    const evidenceNo = await this.generateEvidenceNo();

    const evidence = await this.prisma.evidence.create({
      data: {
        ...createEvidenceDto,
        evidenceNo,
        relatedDocumentDate: createEvidenceDto.relatedDocumentDate
          ? new Date(createEvidenceDto.relatedDocumentDate)
          : null,
      },
      select: evidenceSelectFields,
    });

    this.logger.log(`创建证据成功: ${evidence.evidenceNo}`);
    return evidence;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: EvidenceStatus;
      category?: EvidenceCategory;
      taskId?: string;
      submittedById?: string;
      department?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.submittedById) where.submittedById = filters.submittedById;

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { evidenceNo: { contains: keyword, mode: 'insensitive' } },
        { relatedDocumentNo: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: evidenceSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      select: {
        ...evidenceSelectFields,
        attachments: {
          orderBy: { version: 'desc' },
          select: attachmentSelectFields,
        },
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            result: true,
            comment: true,
            reviewRound: true,
            reviewedAt: true,
            reviewer: { select: { fullName: true } },
          },
        },
        supplementHistory: {
          orderBy: { requestedAt: 'desc' },
          select: {
            id: true,
            reason: true,
            isCompleted: true,
            requestedAt: true,
            completedAt: true,
            requestedBy: { select: { fullName: true } },
            supplementAttachments: {
              select: {
                id: true,
                originalName: true,
                fileSize: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!evidence) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    return evidence;
  }

  async update(id: string, updateEvidenceDto: UpdateEvidenceDto) {
    const existing = await this.prisma.evidence.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    const data: any = { ...updateEvidenceDto };

    if (updateEvidenceDto.relatedDocumentDate) {
      data.relatedDocumentDate = new Date(updateEvidenceDto.relatedDocumentDate);
    }

    const updated = await this.prisma.evidence.update({
      where: { id },
      data,
      select: evidenceSelectFields,
    });

    this.logger.log(`更新证据成功: ${updated.evidenceNo}`);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.evidence.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    if (existing.status !== EvidenceStatus.DRAFT) {
      throw new HttpException('只有草稿状态的证据可以删除', HttpStatus.BAD_REQUEST);
    }

    const attachments = await this.prisma.attachment.findMany({
      where: { evidenceId: id },
      select: { filePath: true },
    });

    for (const att of attachments) {
      try {
        if (fs.existsSync(att.filePath)) {
          fs.unlinkSync(att.filePath);
        }
      } catch (err) {
        this.logger.warn(`删除附件文件失败: ${att.filePath}`);
      }
    }

    await this.prisma.attachment.deleteMany({ where: { evidenceId: id } });
    await this.prisma.evidence.delete({ where: { id } });

    this.logger.log(`删除证据成功: ${existing.evidenceNo}`);
    return { message: '证据已删除' };
  }

  async submit(id: string, userId: string) {
    const existing = await this.prisma.evidence.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    const attachmentCount = await this.prisma.attachment.count({
      where: { evidenceId: id },
    });
    if (attachmentCount === 0) {
      throw new HttpException('请先上传附件后再提交', HttpStatus.BAD_REQUEST);
    }

    if (existing.status !== EvidenceStatus.DRAFT && existing.status !== EvidenceStatus.REJECTED) {
      throw new HttpException('只有草稿或已驳回状态可以提交', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.evidence.update({
      where: { id },
      data: {
        status: EvidenceStatus.SUBMITTED,
        submittedById: userId,
        submittedAt: new Date(),
      },
      select: evidenceSelectFields,
    });

    this.logger.log(`提交证据成功: ${updated.evidenceNo}`);
    return updated;
  }

  async uploadAttachment(
    file: Express.Multer.File,
    uploadDto: UploadAttachmentDto,
    userId: string,
  ) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: uploadDto.evidenceId },
      include: { attachments: true },
    });
    if (!evidence) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    const fileHash = await this.calculateFileMD5(file.path);

    const duplicate = await this.prisma.attachment.findFirst({
      where: {
        evidenceId: uploadDto.evidenceId,
        fileHash: fileHash,
      },
    });
    if (duplicate && !uploadDto.isSupplement) {
      throw new HttpException('相同文件已存在（MD5校验重复）', HttpStatus.CONFLICT);
    }

    const maxVersion = evidence.attachments.reduce(
      (max, a) => Math.max(max, a.version),
      0,
    );

    let supplementRequestId: string | undefined;
    if (uploadDto.isSupplement) {
      const pendingSupplement = await this.prisma.evidenceSupplement.findFirst({
        where: {
          evidenceId: uploadDto.evidenceId,
          isCompleted: false,
        },
        orderBy: { requestedAt: 'desc' },
      });
      supplementRequestId = pendingSupplement?.id;
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileHash,
        evidenceId: uploadDto.evidenceId,
        version: maxVersion + 1,
        isSupplement: uploadDto.isSupplement || false,
        uploadedById: userId,
        supplementId: uploadDto.isSupplement
          ? (uploadDto.supplementRequestId || supplementRequestId)
          : undefined,
      },
      select: attachmentSelectFields,
    });

    if (uploadDto.isSupplement && supplementRequestId) {
      const pendingCount = await this.prisma.evidenceSupplement.count({
        where: {
          evidenceId: uploadDto.evidenceId,
          isCompleted: false,
        },
      });
      if (pendingCount === 0) {
        await this.prisma.evidence.update({
          where: { id: uploadDto.evidenceId },
          data: { status: EvidenceStatus.DRAFT },
        });
      }
    }

    this.logger.log(`上传附件成功: 证据[${evidence.evidenceNo}] 文件[${file.originalname}]`);
    return attachment;
  }

  async requestSupplement(requestDto: SupplementRequestDto, requesterId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: requestDto.evidenceId },
    });
    if (!evidence) {
      throw new HttpException('证据不存在', HttpStatus.NOT_FOUND);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const supplement = await tx.evidenceSupplement.create({
        data: {
          evidenceId: requestDto.evidenceId,
          reason: requestDto.reason,
          requestedById: requesterId,
        },
      });

      await tx.evidence.update({
        where: { id: requestDto.evidenceId },
        data: { status: EvidenceStatus.NEED_SUPPLEMENT },
      });

      return supplement;
    });

    this.logger.log(`发起补附件请求: 证据[${evidence.evidenceNo}]`);
    return result;
  }

  async completeSupplement(supplementId: string, userId: string) {
    const supplement = await this.prisma.evidenceSupplement.findUnique({
      where: { id: supplementId },
      include: {
        evidence: true,
        supplementAttachments: true,
      },
    });

    if (!supplement) {
      throw new HttpException('补附件请求不存在', HttpStatus.NOT_FOUND);
    }

    if (supplement.isCompleted) {
      throw new HttpException('该补附件请求已完成', HttpStatus.BAD_REQUEST);
    }

    if (supplement.supplementAttachments.length === 0) {
      throw new HttpException('请先上传补附件', HttpStatus.BAD_REQUEST);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.evidenceSupplement.update({
        where: { id: supplementId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      const remaining = await tx.evidenceSupplement.count({
        where: {
          evidenceId: supplement.evidenceId,
          isCompleted: false,
        },
      });

      let updatedEvidence: any = supplement.evidence;
      if (remaining === 0) {
        updatedEvidence = await tx.evidence.update({
          where: { id: supplement.evidenceId },
          data: { status: EvidenceStatus.DRAFT },
          select: evidenceSelectFields,
        });
      }

      return {
        id: supplementId,
        evidenceId: supplement.evidenceId,
        isCompleted: true,
        completedAt: new Date(),
        updatedEvidence,
        attachmentCount: supplement.supplementAttachments.length,
      };
    });

    this.logger.log(`补附件请求完成: ${supplementId}`);
    return result;
  }
}
