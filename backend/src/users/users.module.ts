import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolePermissionsModule } from '../role-permissions/role-permissions.module';
import { RolesModule } from '../roles/roles.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RolesModule,
    RolePermissionsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
