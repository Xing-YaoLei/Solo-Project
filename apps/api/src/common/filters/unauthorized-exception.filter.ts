import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { UnauthorizedSeverity, Permission, UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/auth/permissions.decorator';

@Catch(ForbiddenException, UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnauthorizedExceptionFilter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async catch(exception: ForbiddenException | UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof ForbiddenException ? exception.getStatus() : HttpStatus.UNAUTHORIZED;

    const user = (request as any).user;
    const requiredPermissions: Permission[] | undefined = undefined;

    const exceptionResponse: any = exception.getResponse();
    const message = typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse?.message || exception.message;

    if (user && exception instanceof ForbiddenException) {
      try {
        const resourceType = this.extractResourceType(request);
        const resourceId = this.extractResourceId(request);
        const resourceTitle = this.extractResourceTitle(request);
        const severity = this.determineSeverity(request.method, requiredPermissions);
        const attemptedPermission = requiredPermissions?.[0];

        await this.prisma.unauthorizedAccess.create({
          data: {
            userId: user.id,
            userName: user.fullName || user.username,
            userRole: user.role as UserRole,
            resourceType: resourceType,
            resourceId: resourceId,
            resourceTitle: resourceTitle,
            action: this.mapMethodToAction(request.method),
            attemptedPermission: attemptedPermission,
            severity: severity,
            status: 'PENDING',
            ipAddress: request.ip || (request.headers['x-forwarded-for'] as string) || undefined,
            userAgent: request.headers['user-agent'],
            requestParams: {
              url: request.url,
              method: request.method,
              params: request.params,
              query: request.query,
              body: this.sanitizeBody(request.body),
            },
          },
        });

        this.logger.warn(
          `越权访问记录: 用户[${user.username}(${user.role})] 尝试 ${request.method} ${request.url} - ${message}`,
        );
      } catch (logError) {
        this.logger.error(`写入越权记录失败: ${logError.message}`);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      code: exception instanceof ForbiddenException ? 'FORBIDDEN' : 'UNAUTHORIZED',
    });
  }

  private extractResourceType(request: Request): string {
    const pathParts = request.url.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      return pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1).replace(/s$/, '') || 'Unknown';
    }
    return 'Unknown';
  }

  private extractResourceId(request: Request): string {
    return request.params.id || request.body?.id || request.query?.id?.toString() || '0';
  }

  private extractResourceTitle(request: Request): string | undefined {
    return request.body?.title || request.body?.name;
  }

  private determineSeverity(method: string, permissions?: Permission[]): UnauthorizedSeverity {
    if (!permissions) {
      return UnauthorizedSeverity.LOW;
    }

    const sensitivePermissions: Permission[] = [
      Permission.USER_MANAGE,
      Permission.ROLE_MANAGE,
      Permission.STATISTICS_EXPORT,
      Permission.AUDIT_LOG_VIEW,
      Permission.UNAUTHORIZED_VIEW,
    ];

    if (permissions.some((p) => sensitivePermissions.includes(p))) {
      return UnauthorizedSeverity.HIGH;
    }

    if (method === 'DELETE' || method === 'PUT' || method === 'PATCH') {
      return UnauthorizedSeverity.MEDIUM;
    }

    return UnauthorizedSeverity.LOW;
  }

  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      GET: 'VIEW',
      POST: 'CREATE',
      PUT: 'EDIT',
      PATCH: 'EDIT',
      DELETE: 'DELETE',
    };
    return actionMap[method] || method;
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    const sanitized = { ...body };
    ['password', 'token', 'secret', 'authorization'].forEach((key) => {
      if (sanitized[key]) delete sanitized[key];
    });
    return sanitized;
  }
}
