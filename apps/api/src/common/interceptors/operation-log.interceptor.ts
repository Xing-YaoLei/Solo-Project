import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { OperationAction } from '@prisma/client';

export const OPERATION_LOG_METADATA_KEY = 'operation_log';

export interface OperationLogOptions {
  targetType: string;
  action: OperationAction;
  description?: string;
  targetIdField?: string;
  getBeforeData?: (context: ExecutionContext) => Promise<any>;
  getTargetId?: (context: ExecutionContext, result: any) => string;
}

export const OperationLog = (options: OperationLogOptions) =>
  SetMetadata(OPERATION_LOG_METADATA_KEY, options);

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperationLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<OperationLogOptions>(
      OPERATION_LOG_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    let beforeData: any = null;
    let afterData: any = null;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          if (options.getBeforeData) {
            beforeData = await options.getBeforeData(context);
          } else if (
            (options.action === OperationAction.UPDATE ||
              options.action === OperationAction.DELETE) &&
            options.targetIdField
          ) {
            beforeData = await this.fetchBeforeData(
              options.targetType,
              request.params[options.targetIdField] ||
                request.body[options.targetIdField] ||
                request.query[options.targetIdField],
            );
          }

          afterData = this.extractAfterData(result, options.action);

          let targetId: string;
          if (options.getTargetId) {
            targetId = await options.getTargetId(context, result);
          } else if (options.targetIdField) {
            targetId =
              request.params[options.targetIdField] ||
              (result && result[options.targetIdField]) ||
              (result && result.id);
          } else if (result && result.id) {
            targetId = result.id;
          } else if (request.params.id) {
            targetId = request.params.id;
          }

          if (!targetId) {
            this.logger.warn(`无法获取操作记录的targetId: ${options.targetType} ${options.action}`);
            return;
          }

          const taskId = this.extractRelationalId(request, result, 'taskId');
          const evidenceId = this.extractRelationalId(request, result, 'evidenceId');

          let description = options.description;
          if (!description) {
            description = this.generateDefaultDescription(
              options.action,
              options.targetType,
              targetId,
            );
          }

          await this.prisma.operationLog.create({
            data: {
              operatorId: user?.id || 'system',
              operatorName: user?.fullName || user?.username || 'System',
              targetType: options.targetType,
              targetId: targetId,
              action: options.action,
              description: description,
              beforeData: beforeData,
              afterData: afterData,
              ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
              userAgent: userAgent,
              taskId,
              evidenceId,
            },
          });
        } catch (error) {
          this.logger.error(`记录操作日志失败: ${error.message}`);
        }
      }),
      catchError((error) => {
        if (options.action === OperationAction.UPDATE || options.action === OperationAction.DELETE) {
          this.logger.warn(`操作失败，但beforeData未记录: ${options.targetType}`);
        }
        return throwError(() => error);
      }),
    );
  }

  private async fetchBeforeData(targetType: string, targetId: string): Promise<any> {
    if (!targetId) return null;
    try {
      const modelMap: Record<string, any> = {
        AuditTask: this.prisma.auditTask,
        Evidence: this.prisma.evidence,
        User: this.prisma.user,
        ReviewRecord: this.prisma.reviewRecord,
        Checklist: this.prisma.checklist,
        SamplingRecord: this.prisma.samplingRecord,
        Issue: this.prisma.issue,
      };
      const model = modelMap[targetType];
      if (model) {
        return await model.findUnique({ where: { id: targetId } });
      }
      return null;
    } catch (error) {
      this.logger.warn(`获取beforeData失败: ${targetType} ${targetId}: ${error.message}`);
      return null;
    }
  }

  private extractAfterData(result: any, action: OperationAction): any {
    if (!result) return null;
    if (action === OperationAction.DELETE) return null;
    if (result.data) return result.data;
    return result;
  }

  private extractRelationalId(request: any, result: any, field: string): string | undefined {
    return request.params[field] || request.body[field] || (result && result[field]);
  }

  private generateDefaultDescription(
    action: OperationAction,
    targetType: string,
    targetId: string,
  ): string {
    const actionText: Record<OperationAction, string> = {
      [OperationAction.CREATE]: '创建',
      [OperationAction.UPDATE]: '更新',
      [OperationAction.DELETE]: '删除',
      [OperationAction.SUBMIT]: '提交',
      [OperationAction.REVIEW]: '复核',
      [OperationAction.APPROVE]: '通过',
      [OperationAction.REJECT]: '驳回',
      [OperationAction.ASSIGN]: '分派',
      [OperationAction.UPLOAD]: '上传',
      [OperationAction.DOWNLOAD]: '下载',
      [OperationAction.EXPORT]: '导出',
      [OperationAction.BATCH_UPDATE]: '批量更新',
      [OperationAction.ARCHIVE]: '归档',
      [OperationAction.UNARCHIVE]: '取消归档',
    };
    return `${actionText[action] || action} ${targetType}: ${targetId}`;
  }
}
