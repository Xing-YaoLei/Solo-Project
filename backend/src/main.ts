import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  const config = new DocumentBuilder()
    .setTitle('旅游民宿保洁排班任务分派台 API')
    .setDescription('保洁排班、任务分派、押金管理、证件管理等 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3001);
  console.log('Backend server is running on http://localhost:3001');
  console.log('API docs available at http://localhost:3001/api/docs');
}

bootstrap();
