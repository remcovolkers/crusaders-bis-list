import { Module } from '@nestjs/common';
import { AuthController, UserManagementController } from './controllers/auth.controller';
import { RaiderController } from './controllers/raider.controller';
import { AdminController } from './controllers/admin.controller';
import { RolesGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController, UserManagementController, RaiderController, AdminController],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class BackendAdaptersModule {}

