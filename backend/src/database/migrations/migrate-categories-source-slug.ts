import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MigrateCategoriesSourceSlugModule } from './migrate-categories-source-slug.module';

/**
 * Migration một lần (idempotent, an toàn chạy lại) — dọn `sourceSlug: null` tường minh trên
 * category tạo tay (dư ra do `@Prop({ default: null })` cũ trên `category.schema.ts`, đã sửa —
 * xem ghi chú tại đó). Field có unique+sparse index nên chỉ được phép VẮNG MẶT HẲN (không phải
 * `null`) trên category không đến từ Ophim sync — `$unset` thay vì `$set: null` để khớp đúng ý
 * nghĩa `sparse`.
 *
 * Thao tác trực tiếp qua driver Mongo thô (Connection.db), không qua Mongoose Category model —
 * cùng nguyên tắc `migrate-comments-hidden.ts`.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigrateCategoriesSourceSlugModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const db = connection.db;
    if (!db) {
      throw new Error('Không lấy được kết nối MongoDB');
    }

    const result = await db
      .collection('categories')
      .updateMany({ sourceSlug: null }, { $unset: { sourceSlug: '' } });

    console.log(`Đã xoá sourceSlug=null tường minh trên ${result.modifiedCount} category.`);
  } finally {
    await app.close();
  }
}

bootstrap();
