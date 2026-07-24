import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { PermissionsModule } from '../../permissions/permissions.module';
import { RolePermissionsModule } from '../../role-permissions/role-permissions.module';
import { RolesModule } from '../../roles/roles.module';
import { UsersModule } from '../../users/users.module';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UsersModule,
  ],
})
export class SeedRbacModule {}
