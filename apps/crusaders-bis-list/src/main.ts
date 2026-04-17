import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as session from 'express-session';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    credentials: true,
  });

  // Session middleware — only needed for OAuth state during login handshake
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionMiddleware = (session as any).default ?? session;
  app.use(
    sessionMiddleware({
      secret: process.env['JWT_SECRET'] ?? 'oauth-state-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env['NODE_ENV'] === 'production', maxAge: 5 * 60 * 1000 },
    }),
  );

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.setGlobalPrefix('api');

  await app.listen(process.env['PORT'] ?? 3000);

  Logger.log(`Application running on port ${process.env['PORT'] ?? 3000}`);
}

bootstrap();
