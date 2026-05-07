import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackendApplicationModule } from '@crusaders-bis-list/backend-application';
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
  AuditLogOrmEntity,
  RaidPlanOrmEntity,
  RaidPlanParticipantOrmEntity,
} from '@crusaders-bis-list/backend-infrastructure';
import { DiscordBotService } from './discord-bot.service';

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
          AuditLogOrmEntity,
          RaidPlanOrmEntity,
          RaidPlanParticipantOrmEntity,
        ],
        synchronize: false,
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    BackendApplicationModule,
  ],
  providers: [DiscordBotService],
})
export class AppModule {}
