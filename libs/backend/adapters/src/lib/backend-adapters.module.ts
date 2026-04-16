import { Module } from '@nestjs/common';
import { AuthController, UserManagementController } from './controllers/auth.controller';
import { RaiderController } from './controllers/raider.controller';
import { AdminController } from './controllers/admin.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { RollController } from './controllers/roll.controller';
import { RolesGuard } from './guards/auth.guard';
import { GoogleStrategy } from './auth/google.strategy';
import { JwtStrategy } from './auth/jwt.strategy';
import { BackendApplicationModule } from '@crusaders-bis-list/backend-application';

@Module({
  imports: [BackendApplicationModule],
  controllers: [
    AuthController,
    UserManagementController,
    RaiderController,
    AdminController,
    FeedbackController,
    RollController,
  ],
  providers: [RolesGuard, GoogleStrategy, JwtStrategy],
  exports: [RolesGuard],
})
export class BackendAdaptersModule {}
