import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { SensitiveFieldInterceptor } from './sensitive-field.interceptor';

@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveFieldInterceptor,
    },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
