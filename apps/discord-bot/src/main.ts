import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  process.on('SIGTERM', () => app.close());
  process.on('SIGINT', () => app.close());
}

bootstrap();
