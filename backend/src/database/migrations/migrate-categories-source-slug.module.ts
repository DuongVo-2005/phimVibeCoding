import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../database.module';

// Cùng nguyên tắc các migration trước (migrate-comments-hidden...): chỉ import ConfigModule +
// DatabaseModule, thao tác trực tiếp qua driver Mongo thô, không phụ thuộc Mongoose model/schema.
@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class MigrateCategoriesSourceSlugModule {}
