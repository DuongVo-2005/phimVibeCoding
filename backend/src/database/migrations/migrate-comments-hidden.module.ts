import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../database.module';

// Chỉ import ConfigModule + DatabaseModule (không import CommentsModule) — cùng nguyên tắc với các
// migration trước (migrate-types-to-categories, migrate-films-categories-published): tránh mọi phụ
// thuộc vào Mongoose model/schema hiện tại khi thao tác trực tiếp qua driver Mongo thô.
@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class MigrateCommentsHiddenModule {}
