import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { BackendDomainModule } from '@crusaders-bis-list/backend-domain';
import { BackendApplicationModule } from '@crusaders-bis-list/backend-application';
import { BackendInfrastructureModule } from '@crusaders-bis-list/backend-infrastructure';
import { BackendAdaptersModule } from '@crusaders-bis-list/backend-adapters';
import {
  UserOrmEntity,
  RaiderProfileOrmEntity,
  RaidSeasonOrmEntity,
  BossOrmEntity,
  ItemOrmEntity,
  ReservationOrmEntity,
  AssignmentOrmEntity,
  SeasonConfigOrmEntity,
  RaiderReceivedItemOrmEntity,
  FeedbackOrmEntity,
  MIGRATIONS,
} from '@crusaders-bis-list/backend-infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [
          UserOrmEntity,
          RaiderProfileOrmEntity,
          RaidSeasonOrmEntity,
          BossOrmEntity,
          ItemOrmEntity,
          ReservationOrmEntity,
          AssignmentOrmEntity,
          SeasonConfigOrmEntity,
          RaiderReceivedItemOrmEntity,
          FeedbackOrmEntity,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        migrations: MIGRATIONS,
        migrationsRun: true,
        migrationsTableName: 'typeorm_migrations',
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BackendDomainModule,
    BackendApplicationModule,
    BackendInfrastructureModule,
    BackendAdaptersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
