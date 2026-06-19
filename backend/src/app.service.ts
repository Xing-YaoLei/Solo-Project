import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'autoservice-backend',
      version: '1.0.0',
    };
  }
}
