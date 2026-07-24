import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PermissionResolverService } from './permission-resolver.service';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermission, RolePermissionSchema } from './schemas/role-permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RolePermissionsService, PermissionResolverService],
  exports: [RolePermissionsService, PermissionResolverService],
})
export class RolePermissionsModule {}
