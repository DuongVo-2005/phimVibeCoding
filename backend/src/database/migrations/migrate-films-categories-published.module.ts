import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../database.module';

// Chỉ import ConfigModule + DatabaseModule (không import FilmsModule) — thao tác qua driver Mongo
// thô, cùng nguyên tắc với các migration trước (migrate-types-to-categories, migrate-film-country-
// director-refs): tránh mọi phụ thuộc vào Mongoose model/schema hiện tại (vốn đã kỳ vọng field
// `categories` mới) khi vẫn còn thao tác trên dữ liệu ở shape CŨ (field `types`).
@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class MigrateFilmsCategoriesPublishedModule {}
