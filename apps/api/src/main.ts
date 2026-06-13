import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API server is running on http://localhost:${port}`);
}

bootstrap();
