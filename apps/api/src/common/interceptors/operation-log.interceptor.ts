import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Observable, throwError, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { OperationAction } from '@prisma/client';

export const OPERATION_LOG_METADATA_KEY = 'operation_log';

export interface OperationLogOptions {
  targetType: string;
  action: OperationAction;
  description?: string;
  targetIdField?: string;
  beforeDataTargetIdField?: string;
  beforeDataLookup?: {
    model: string;
    foreignKey: string;
    idSource: 'params' | 'body' | 'query';
    idField: string;
  };
  getBeforeData?: (context: ExecutionContext, prisma: any) => Promise<any>;
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

    const beforeDataPromise = (async () => {
      try {
        if (options.getBeforeData) {
          return await options.getBeforeData(context, this.prisma);
        }

        if (options.beforeDataLookup) {
          const lookup = options.beforeDataLookup;
          const sourceId =
            lookup.idSource === 'params'
              ? request.params[lookup.idField]
              : lookup.idSource === 'body'
                ? request.body[lookup.idField]
                : request.query[lookup.idField];
          if (sourceId && (this.prisma as any)[lookup.model]) {
            const intermediate = await (this.prisma as any)[lookup.model].findUnique({
              where: { id: sourceId },
              select: { [lookup.foreignKey]: true },
            });
            if (intermediate && intermediate[lookup.foreignKey]) {
              return await this.fetchBeforeData(options.targetType, intermediate[lookup.foreignKey]);
            }
          }
          return null;
        }

        const shouldCaptureBefore =
          options.action === OperationAction.UPDATE ||
          options.action === OperationAction.DELETE ||
          options.action === OperationAction.SUBMIT ||
          options.action === OperationAction.REVIEW ||
          options.action === OperationAction.APPROVE ||
          options.action === OperationAction.REJECT ||
          options.action === OperationAction.ASSIGN ||
          options.action === OperationAction.ARCHIVE;
        if (shouldCaptureBefore) {
          const idField = options.beforeDataTargetIdField || options.targetIdField;
          if (idField) {
            const targetId =
              request.params[idField] ||
              request.body[idField] ||
              request.query[idField];
            return await this.fetchBeforeData(options.targetType, targetId);
          }
        }
        return null;
      } catch (error) {
        this.logger.warn(`采集beforeData失败: ${options.targetType}: ${error.message}`);
        return null;
      }
    })();

    return from(beforeDataPromise).pipe(
      switchMap((beforeData) => {
        return next.handle().pipe(
          tap(async (result) => {
            try {
              const afterData = this.extractAfterData(result, options.action);

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
              this.logger.warn(`操作失败，beforeData已采集: ${options.targetType}`);
            }
            return throwError(() => error);
          })
        );
      })
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
