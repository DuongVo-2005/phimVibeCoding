import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { UsersModule } from '../../users/users.module';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule],
})
export class SeedAdminModule {}
