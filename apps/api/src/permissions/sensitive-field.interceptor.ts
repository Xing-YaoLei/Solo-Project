import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PermissionsService } from './permissions.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SensitiveFieldInterceptor implements NestInterceptor {
  constructor(private permissionsService: PermissionsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      map((data) => {
        if (!user) return data;
        return this.filterSensitiveFields(data, user.role);
      }),
    );
  }

  private filterSensitiveFields(data: any, role: UserRole): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.filterSensitiveFields(item, role));
    }

    if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (!this.permissionsService.isFieldVisible(key, role)) {
          continue;
        }
        const pattern = this.permissionsService.getMaskPattern(key);
        if (pattern && typeof value === 'string') {
          result[key] = this.permissionsService.maskValue(value, pattern);
        } else if (typeof value === 'object') {
          result[key] = this.filterSensitiveFields(value, role);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return data;
  }
}
