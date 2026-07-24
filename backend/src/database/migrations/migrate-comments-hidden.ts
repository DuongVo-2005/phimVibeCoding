import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MigrateCommentsHiddenModule } from './migrate-comments-hidden.module';

/**
 * Migration một lần (idempotent, an toàn chạy lại) cho Phase 5.3 — Comments moderation:
 * backfill `isHidden:false` cho mọi bình luận chưa có field này — bắt buộc vì Mongoose chỉ áp
 * `default` khi hydrate trong bộ nhớ, KHÔNG ghi giá trị mặc định xuống MongoDB, nên
 * `find({isHidden:false})` (bộ lọc ngầm định cho mọi listing công khai) sẽ bỏ sót toàn bộ bình
 * luận cũ nếu không backfill tường minh (cùng bài học đã gặp ở migrate-films-categories-published).
 *
 * Thao tác trực tiếp qua driver Mongo thô (Connection.db), không qua Mongoose Comment model.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigrateCommentsHiddenModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const db = connection.db;
    if (!db) {
      throw new Error('Không lấy được kết nối MongoDB');
    }

    const result = await db
      .collection('comments')
      .updateMany({ isHidden: { $exists: false } }, { $set: { isHidden: false } });

    console.log(`Đã backfill isHidden=false cho ${result.modifiedCount} bình luận.`);
  } finally {
    await app.close();
  }
}

bootstrap();
