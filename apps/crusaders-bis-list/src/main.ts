import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';
import { seedRaidCatalog } from '@crusaders-bis-list/backend-infrastructure';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.setGlobalPrefix('api');

  await app.listen(process.env['PORT'] ?? 3000);

  // Run seed after startup
  const dataSource = app.get(DataSource);
  await seedRaidCatalog(dataSource);

  Logger.log(`Application running on port ${process.env['PORT'] ?? 3000}`);
}

bootstrap();

